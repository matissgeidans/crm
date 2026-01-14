import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

const app = express();
const httpServer = createServer(app);

// Middleware for JSON + raw body
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// Logging helper
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ---------------- PostgreSQL Pool ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------- Initialize DB ----------------
async function initDB() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        role TEXT DEFAULT 'driver',
        vehicle_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // Create trips table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_number TEXT,
        trip_date TIMESTAMP,
        driver_id UUID REFERENCES users(id),
        client_id UUID,
        manual_client_name TEXT,
        vehicle_id TEXT,
        cargo_name TEXT,
        license_plate TEXT,
        weight_category TEXT,
        distance_km NUMERIC,
        duration_hours NUMERIC,
        pickup_location TEXT,
        dropoff_location TEXT,
        is_tala_riga BOOLEAN DEFAULT false,
        is_pieriga BOOLEAN DEFAULT false,
        has_rati BOOLEAN DEFAULT false,
        rati_type INT,
        has_tehniska_palidziba BOOLEAN DEFAULT false,
        has_darbs_nakti BOOLEAN DEFAULT false,
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

    // Insert demo user if not exists
    const { rowCount } = await client.query(`SELECT * FROM users WHERE username = 'demo'`);
    if (rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, password, first_name, last_name, email, role, vehicle_name, profile_image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        ["demo", "demo123", "Demo", "User", "demo@example.com", "driver", "DemoCar", "https://via.placeholder.com/150"]
      );
      log("✅ Demo user created: username=demo, password=demo123");
    } else {
      log("ℹ️ Demo user already exists");
    }

    log("✅ Database tables created or updated");
  } finally {
    client.release();
  }
}

// ---------------- Routes ----------------
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ---------------- Error handler ----------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  log(`❌ Error: ${message}`, "express");
});

// ---------------- Main ----------------
(async () => {
  await initDB();

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
