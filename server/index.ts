import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

const app = express();
const httpServer = createServer(app);

// --- DB pool ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      console.log(logLine);
    }
  });

  next();
});

// --- DB init + demo user ---
async function initDB() {
  const client = await pool.connect();
  try {
    // --- Create users table ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        role TEXT DEFAULT 'user',
        vehicle_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // --- Create demo user if missing ---
    const { rowCount } = await client.query(`SELECT id FROM users WHERE username='demo'`);
    if (rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, password_hash, first_name, last_name, email, role, vehicle_name, profile_image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          "demo",
          "demo123", // TODO: vēlāk šifrēt
          "Demo",
          "User",
          "demo@example.com",
          "admin",
          "Demo Truck",
          "https://via.placeholder.com/150",
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

// --- Basic test route ---
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Server is running!" });
});

// --- Error handler ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
  throw err;
});

// --- Start server ---
(async () => {
  await initDB();

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
