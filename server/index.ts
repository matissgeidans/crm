// server/index.ts
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

// ES modulī __dirname triks
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- App & Server ----------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- Session ----------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "demo-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ---------------- PostgreSQL Pool ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // svarīgi Free tier
});

// ---------------- Auto-create / update tables & demo user ----------------
async function initDB() {
  const client = await pool.connect();
  try {
    // Izveido tabulu users, ja nav
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT DEFAULT 'vaditajs',
        vehicle_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_number TEXT,
        trip_date TIMESTAMP,
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
        cost_calculated NUMERIC,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // Pievieno demo lietotāju, ja nav
    const { rowCount } = await client.query("SELECT * FROM users WHERE username = $1", ["demo"]);
    if (rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, password_hash, email, first_name, last_name, role, vehicle_name, profile_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ["demo", "demo123", "demo@example.com", "Demo", "User", "vaditajs", "DemoTruck", "https://via.placeholder.com/150"]
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

// ---------------- React SPA ----------------
const distPath = path.join(__dirname, "..", "dist", "public");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ---------------- Error handling ----------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

// ---------------- Main Async IIFE ----------------
(async () => {
  try {
    await initDB();

    const port = parseInt(process.env.PORT || "5000", 10);
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
})();
