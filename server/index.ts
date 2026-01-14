import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Pool } from "pg";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { v4 as uuidv4 } from "uuid";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ---------------- Express Middleware ----------------
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

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
  ssl: { rejectUnauthorized: false }, // Free tier
});

// ---------------- Initialize DB ----------------
async function initDB() {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        email TEXT,
        role TEXT DEFAULT 'driver',
        "vehicleName" TEXT,
        profileImageUrl TEXT,
        createdAt TIMESTAMP DEFAULT now(),
        updatedAt TIMESTAMP DEFAULT now()
      );
    `);

    // Trips table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tripNumber TEXT UNIQUE NOT NULL,
        tripDate TIMESTAMP,
        driverId UUID REFERENCES users(id),
        clientId UUID REFERENCES users(id),
        manualClientName TEXT,
        vehicleId UUID,
        cargoName TEXT,
        licensePlate TEXT,
        weightCategory TEXT,
        distanceKm NUMERIC,
        durationHours NUMERIC,
        pickupLocation TEXT,
        dropoffLocation TEXT,
        isTalaRiga BOOLEAN DEFAULT false,
        isPieriga BOOLEAN DEFAULT false,
        hasRati BOOLEAN DEFAULT false,
        ratiType INT,
        hasTehniskaPalidziba BOOLEAN DEFAULT false,
        hasDarbsNakti BOOLEAN DEFAULT false,
        paymentType TEXT,
        cashAmount NUMERIC,
        extraCosts NUMERIC,
        extraCostsDescription TEXT,
        status TEXT DEFAULT 'draft',
        notes TEXT,
        paymentNotes TEXT,
        costCalculated NUMERIC,
        createdAt TIMESTAMP DEFAULT now(),
        updatedAt TIMESTAMP DEFAULT now()
      );
    `);

    // Check if demo user exists
    const { rowCount } = await client.query(`SELECT id FROM users WHERE username = 'demo'`);
    if (rowCount === 0) {
      await client.query(
        `INSERT INTO users (
          id,
          username,
          password_hash,
          firstName,
          lastName,
          email,
          role,
          "vehicleName",
          profileImageUrl
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          uuidv4(),
          "demo",
          "$2b$10$DemoHashForTestingPurposes", // fake hash for demo
          "Demo",
          "User",
          "demo@example.com",
          "admin",
          "DemoTruck",
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

// ---------------- Logging Middleware ----------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

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
      log(logLine);
    }
  });

  next();
});

// ---------------- Main Async IIFE ----------------
(async () => {
  await initDB();
  await registerRoutes(httpServer, app);

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite only in development
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => log(`🚀 Server running on port ${port}`)
  );
})();
