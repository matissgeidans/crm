import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Init DB: tables + demo user
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
        trip_number SERIAL PRIMARY KEY,
        trip_date TIMESTAMP DEFAULT now(),
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
        is_tala_riga BOOLEAN DEFAULT false,
        is_pieriga BOOLEAN DEFAULT false,
        has_rati BOOLEAN DEFAULT false,
        rati_type INTEGER,
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

    // Check if demo user exists
    const res = await client.query(`SELECT id FROM users WHERE username=$1`, ["demo"]);
    if (res.rowCount === 0) {
      await client.query(
        `INSERT INTO users 
         (username, password_hash, email, first_name, last_name, role, vehicle_name, profile_image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          "demo",
          "demo123", 
          "demo@example.com",
          "Demo",
          "User",
          "driver",
          "Demo Car",
          "https://via.placeholder.com/150"
        ]
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

// Simple route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

(async () => {
  await initDB();

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`Server running on port ${port}`);
  });
})();
