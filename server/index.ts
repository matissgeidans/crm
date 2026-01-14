import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ---------------- Middleware ----------------
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret123",
  resave: false,
  saveUninitialized: true
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine);
    }
  });

  next();
});

// ---------------- PostgreSQL Pool ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------- DB Initialization ----------------
async function initDB() {
  const client = await pool.connect();

  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT DEFAULT 'driver',
        vehicle_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // Trips table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_number TEXT UNIQUE NOT NULL,
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
        is_tala_riga BOOLEAN DEFAULT FALSE,
        is_pieriga BOOLEAN DEFAULT FALSE,
        has_rati BOOLEAN DEFAULT FALSE,
        rati_type INTEGER,
        has_tehniska_palidziba BOOLEAN DEFAULT FALSE,
        has_darbs_nakti BOOLEAN DEFAULT FALSE,
        payment_type TEXT,
        cash_amount NUMERIC,
        extra_costs NUMERIC,
        extra_costs_description TEXT,
        status TEXT DEFAULT 'draft',
        notes TEXT,
        payment_notes TEXT,
        cost_calculated NUMERIC,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // Check if demo user exists
    const { rowCount } = await client.query(`SELECT id FROM users WHERE username=$1`, ['demo']);
    if (rowCount === 0) {
      await client.query(`
        INSERT INTO users (username, password_hash, email, first_name, last_name, role, vehicle_name, profile_image_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [
        'demo',
        'demo123', // 🔹 vēlāk drošāk: hash ar bcrypt
        'demo@example.com',
        'Demo',
        'User',
        'admin',
        'DemoCar',
        'https://via.placeholder.com/150'
      ]);
      console.log("✅ Demo user created: username=demo, password=demo123");
    } else {
      console.log("ℹ️ Demo user already exists");
    }

    console.log("✅ Database tables created or updated");

  } finally {
    client.release();
  }
}

// ---------------- Main ----------------
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
    log(`Server running on port ${port}`);
  });
})();
