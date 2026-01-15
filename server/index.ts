import express from "express";
import session from "express-session";
import pg from "pg";
import { createServer } from "http";

const { Pool } = pg;

const app = express();
const httpServer = createServer(app);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ---------------- PostgreSQL ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---------------- INIT DB ----------------
async function initDB() {
  const client = await pool.connect();
  try {
    console.log("🔥 Resetting database schema...");

    // ❗ FORCE DROP OLD TABLES
    await client.query(`
      DROP TABLE IF EXISTS trips CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log("🧱 Creating users table...");
    await client.query(`
      CREATE TABLE users (
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
    `);

    console.log("🧱 Creating trips table...");
    await client.query(`
      CREATE TABLE trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_number SERIAL,
        trip_date TIMESTAMP NOT NULL,
        driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
        has_tehniska_palidizba BOOLEAN DEFAULT false,
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

    console.log("👤 Creating demo user...");
    await client.query(`
      INSERT INTO users (
        username,
        password_hash,
        first_name,
        last_name,
        email,
        role,
        vehicle_name,
        profile_image_url
      )
      VALUES (
        'demo',
        'demo123',
        'Demo',
        'User',
        'demo@example.com',
        'admin',
        'MAN TGX',
        'https://via.placeholder.com/150'
      );
    `);

    console.log("✅ Database initialized successfully");
  } finally {
    client.release();
  }
}

// ---------------- START ----------------
(async () => {
  await initDB();

  const port = Number(process.env.PORT || 5000);
  httpServer.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
