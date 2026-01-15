import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import path from "path";
import http from "http";

// ---------------- PostgreSQL Pool ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Free tier
});

// ---------------- Express App ----------------
const app = express();
app.use(express.json());

// ---------------- DB Init ----------------
async function initDB() {
  const client = await pool.connect();
  try {
    // 1️⃣ Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT,
        vehicle_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // 2️⃣ Create trips table
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
        rati_type INTEGER,
        has_tehniska_palidziba BOOLEAN DEFAULT false,
        has_darbs_nakti BOOLEAN DEFAULT false,
        payment_type TEXT,
        cash_amount NUMERIC,
        extra_costs NUMERIC,
        extra_costs_description TEXT,
        status TEXT,
        notes TEXT,
        payment_notes TEXT,
        cost_calculated NUMERIC,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // 3️⃣ Insert demo user if not exists
    const res = await client.query(`SELECT COUNT(*) FROM users WHERE username='demo';`);
    if (parseInt(res.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO users (username, password_hash, email, first_name, last_name, role, vehicle_name, profile_image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          "demo",
          "demo123", // TODO: replace with hashed password in prod
          "demo@example.com",
          "Demo",
          "User",
          "admin",
          "Demo Truck",
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

// ---------------- API Routes (example) ----------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------- Serve React SPA ----------------
const distPath = path.join(__dirname, "..", "dist", "public");
app.use(express.static(distPath));

// Catch-all for React router
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ---------------- Error handler ----------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ---------------- Start Server ----------------
(async () => {
  await initDB();

  const port = parseInt(process.env.PORT || "5000", 10);
  http.createServer(app).listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
