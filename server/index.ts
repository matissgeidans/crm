import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

// ---------------- PostgreSQL Pool ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Free tier
});

// ---------------- Middleware ----------------
app.use(express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ---------------- Request logging ----------------
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJson: any = undefined;
  const originalJson = res.json;
  res.json = function(body, ...args) {
    capturedJson = body;
    return originalJson.apply(res, [body, ...args]);
  };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (capturedJson) logLine += ` :: ${JSON.stringify(capturedJson)}`;
      log(logLine);
    }
  });
  next();
});

// ---------------- Initialize Database ----------------
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        role TEXT DEFAULT 'driver',
        vehicle_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS trips (
        trip_number UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_date TIMESTAMP NOT NULL,
        driver_id UUID REFERENCES users(id),
        client_id UUID,
        manual_client_name TEXT,
        vehicle_id UUID,
        cargo_name TEXT,
        license_plate TEXT,
        weight_category TEXT,
        distance_km NUMERIC,
        duration_hours NUMERIC,
        pickup_location TEXT,
        dropoff_location TEXT,
        is_tala_riga BOOLEAN,
        is_pieriga BOOLEAN,
        has_rati BOOLEAN,
        rati_type INT,
        has_tehniska_palidziba BOOLEAN,
        has_darbs_nakti BOOLEAN,
        payment_type TEXT,
        cash_amount NUMERIC,
        extra_costs NUMERIC,
        extra_costs_description TEXT,
        status TEXT,
        notes TEXT,
        payment_notes TEXT,
        cost_calculated NUMERIC
      );
    `);

    const { rowCount } = await client.query(`SELECT * FROM users WHERE username='demo'`);
    if (rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, password_hash, email, first_name, last_name, role, vehicle_name, profile_image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        ["demo", "demo123", "demo@example.com", "Demo", "User", "admin", "Demo Vehicle", "https://via.placeholder.com/150"]
      );
      console.log("✅ Demo user created: username=demo, password=demo123");
    } else {
      console.log("ℹ️ Demo user already exists");
    }

    console.log("✅ Database tables created or updated");
  } finally {
    client.release();
  }
}

// ---------------- Main Async IIFE ----------------
(async () => {
  await initDB();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
