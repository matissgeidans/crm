import express from "express";
import session from "express-session";
import pg from "pg";
import crypto from "crypto";

const { Pool } = pg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// UUID helper (bez uuid pakotnes)
function uuid() {
  return crypto.randomUUID();
}

async function initDB() {
  // USERS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'driver',
      vehicle_name TEXT,
      profile_image_url TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  // TRIPS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id UUID PRIMARY KEY,
      trip_number TEXT,
      trip_date TIMESTAMP,
      driver_id UUID REFERENCES users(id),
      manual_client_name TEXT,
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

  // DEMO USER
  await pool.query(
    `
    INSERT INTO users (id, username, password, role)
    VALUES ($1, 'admin', 'admin', 'admin')
    ON CONFLICT (username) DO NOTHING
    `,
    [uuid()]
  );

  console.log("✅ Database initialized");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

(async () => {
  await initDB();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on ${port}`);
  });
})();
