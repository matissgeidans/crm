import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertClientSchema, insertTripSchema } from "@shared/schema";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes - public endpoint to check auth state
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json(null);
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.json(null);
    }
  });

  // User routes
  app.get("/api/users/drivers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partialSchema = insertClientSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const client = await storage.updateClient(parseInt(req.params.id), validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      console.error("Error updating client:", error);
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteClient(parseInt(req.params.id));
      if (!success) {
        return res.status(400).json({ message: "Cannot delete client with associated trips" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Trip routes
  app.get("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // If admin and specific filters, use those
      if (user?.role === "admin" && (req.query.limit || req.query.status)) {
        const filters: any = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.limit) filters.limit = parseInt(req.query.limit);
        const trips = await storage.getAllTrips(filters);
        return res.json(trips);
      }
      
      // Drivers can only see their own trips - ignore any query params
      const trips = await storage.getTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/all", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.driverId) {
        filters.driverId = req.query.driverId;
      }
      if (req.query.clientId) {
        filters.clientId = parseInt(req.query.clientId as string);
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.minDistance) {
        filters.minDistance = parseFloat(req.query.minDistance as string);
      }
      if (req.query.maxDistance) {
        filters.maxDistance = parseFloat(req.query.maxDistance as string);
      }

      const trips = await storage.getAllTrips(filters);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching all trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Enforce driver scoping at storage level
      const driverId = user?.role === "admin" ? undefined : userId;
      const trip = await storage.getTrip(parseInt(req.params.id), driverId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = {
        ...req.body,
        driverId: userId,
        tripDate: req.body.tripDate ? new Date(req.body.tripDate) : new Date(),
      };
      
      const validatedData = insertTripSchema.parse(tripData);
      const trip = await storage.createTrip(validatedData);
      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: "Failed to create trip" });
    }
  });

  app.patch("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Enforce driver scoping at storage level
      const driverId = user?.role === "admin" ? undefined : userId;
      const existingTrip = await storage.getTrip(tripId, driverId);
      
      if (!existingTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Drivers can only edit draft or submitted trips (not approved/rejected)
      if (user?.role !== "admin" && !["draft", "submitted"].includes(existingTrip.status)) {
        return res.status(403).json({ message: "Cannot edit processed trips" });
      }

      const partialTripSchema = insertTripSchema.partial();
      // Ensure tripDate is a Date object if provided, and remove costCalculated if it exists in body
      const body = { ...req.body };
      delete body.costCalculated;
      delete body.id; // Also remove id if sent by accident
      
      const validatedData = partialTripSchema.parse({
        ...body,
        tripDate: body.tripDate ? new Date(body.tripDate) : undefined,
      });
      
      // Pass driverId to enforce scoping at storage level
      const trip = await storage.updateTrip(tripId, validatedData, driverId);
      res.json(trip);
    } catch (error: any) {
      console.error("Error updating trip:", error);
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  app.patch("/api/trips/:id/review", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { action, adminNotes } = req.body;
      
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const trip = await storage.reviewTrip(parseInt(req.params.id), status, adminNotes);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error reviewing trip:", error);
      res.status(500).json({ message: "Failed to review trip" });
    }
  });

  // Stats routes
  app.get("/api/stats/driver", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDriverStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching driver stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/stats/admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, vehicleName } = req.body;
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        vehicleName,
      });
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Export routes
  app.get("/api/reports/export/excel", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.driverId) {
        filters.driverId = req.query.driverId;
      }
      if (req.query.clientId) {
        filters.clientId = parseInt(req.query.clientId as string);
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }

      const trips = await storage.getAllTrips(filters);
      
      const data = trips.map((trip) => ({
        "Trip Date": new Date(trip.tripDate).toLocaleDateString(),
        "Driver": trip.driver?.firstName 
          ? `${trip.driver.firstName} ${trip.driver.lastName || ""}`
          : trip.driver?.email || "Unknown",
        "Client": trip.client?.name || "-",
        "Vehicle": `${trip.vehicleMake} ${trip.vehicleModel}`,
        "Color": trip.vehicleColor || "-",
        "License Plate": trip.licensePlate,
        "Pickup": trip.pickupLocation || "-",
        "Drop-off": trip.dropoffLocation || "-",
        "Distance (km)": Number(trip.distanceKm).toFixed(1),
        "Cost ($)": trip.costCalculated ? Number(trip.costCalculated).toFixed(2) : "-",
        "Status": trip.status.charAt(0).toUpperCase() + trip.status.slice(1),
        "Notes": trip.notes || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trip Reports");

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="trip-report-${new Date().toISOString().split("T")[0]}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  app.get("/api/reports/export/pdf", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.driverId) {
        filters.driverId = req.query.driverId;
      }
      if (req.query.clientId) {
        filters.clientId = parseInt(req.query.clientId as string);
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }

      const trips = await storage.getAllTrips(filters);
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("TowTrack CRM", 14, 22);
      doc.setFontSize(12);
      doc.text("Trip Report", 14, 30);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
      
      // Summary
      const totalTrips = trips.length;
      const totalDistance = trips.reduce((sum, t) => sum + Number(t.distanceKm), 0);
      const totalRevenue = trips.reduce((sum, t) => sum + (Number(t.costCalculated) || 0), 0);
      
      doc.setFontSize(11);
      doc.text("Summary", 14, 48);
      doc.setFontSize(10);
      doc.text(`Total Trips: ${totalTrips}`, 14, 54);
      doc.text(`Total Distance: ${totalDistance.toFixed(1)} km`, 14, 60);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, 66);
      
      // Table
      const tableData = trips.map((trip) => [
        new Date(trip.tripDate).toLocaleDateString(),
        trip.driver?.firstName 
          ? `${trip.driver.firstName} ${trip.driver.lastName?.charAt(0) || ""}.`
          : trip.driver?.email?.split("@")[0] || "-",
        trip.client?.name || "-",
        `${trip.vehicleMake} ${trip.vehicleModel}`,
        trip.licensePlate,
        `${Number(trip.distanceKm).toFixed(1)} km`,
        trip.costCalculated ? `$${Number(trip.costCalculated).toFixed(2)}` : "-",
        trip.status.charAt(0).toUpperCase() + trip.status.slice(1),
      ]);

      autoTable(doc, {
        startY: 74,
        head: [["Date", "Driver", "Client", "Vehicle", "Plate", "Distance", "Cost", "Status"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
      });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="trip-report-${new Date().toISOString().split("T")[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  return httpServer;
}
