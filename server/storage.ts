import {
  users,
  clients,
  trips,
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Trip,
  type InsertTrip,
  type TripWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllDrivers(): Promise<User[]>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Trip operations
  getTrips(driverId?: string): Promise<TripWithRelations[]>;
  getAllTrips(filters?: TripFilters): Promise<TripWithRelations[]>;
  getTrip(id: number, driverId?: string): Promise<TripWithRelations | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>, driverId?: string): Promise<Trip | undefined>;
  reviewTrip(id: number, status: "approved" | "rejected", adminNotes?: string): Promise<Trip | undefined>;
  
  // Stats
  getDriverStats(driverId: string): Promise<DriverStats>;
  getAdminStats(): Promise<AdminStats>;
  getAnalytics(): Promise<AnalyticsData>;
}

export interface TripFilters {
  startDate?: Date;
  endDate?: Date;
  driverId?: string;
  clientId?: number;
  status?: string;
  minDistance?: number;
  maxDistance?: number;
  limit?: number;
}

export interface DriverStats {
  tripsToday: number;
  tripsThisWeek: number;
  totalKmThisWeek: number;
  pendingReports: number;
}

export interface AdminStats {
  totalTripsMonth: number;
  totalKmMonth: number;
  totalRevenueMonth: number;
  activeDrivers: number;
  pendingReports: number;
  approvedThisWeek: number;
  topClients: { name: string; trips: number; revenue: number }[];
  tripsByDay: { date: string; count: number }[];
  tripsByStatus: { status: string; count: number }[];
}

export interface AnalyticsData {
  totalTripsAllTime: number;
  totalKmAllTime: number;
  totalRevenueAllTime: number;
  averageTripDistance: number;
  averageTripCost: number;
  totalClients: number;
  totalDrivers: number;
  revenueByMonth: { month: string; revenue: number }[];
  tripsByDriver: { driver: string; trips: number }[];
  tripsByClient: { client: string; trips: number; revenue: number }[];
  distanceByMonth: { month: string; distance: number }[];
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllDrivers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "driver"));
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updated;
  }

  async deleteClient(id: number): Promise<boolean> {
    // Check if client has trips
    const [tripCount] = await db
      .select({ count: count() })
      .from(trips)
      .where(eq(trips.clientId, id));
    
    if (tripCount && tripCount.count > 0) {
      return false;
    }

    const result = await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  // Trip operations
  async getTrips(driverId?: string): Promise<TripWithRelations[]> {
    const result = await db.query.trips.findMany({
      where: driverId ? eq(trips.driverId, driverId) : undefined,
      with: {
        driver: true,
        client: true,
      },
      orderBy: [desc(trips.tripDate)],
    });
    return result;
  }

  async getAllTrips(filters?: TripFilters): Promise<TripWithRelations[]> {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(gte(trips.tripDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(trips.tripDate, filters.endDate));
    }
    if (filters?.driverId) {
      conditions.push(eq(trips.driverId, filters.driverId));
    }
    if (filters?.clientId) {
      conditions.push(eq(trips.clientId, filters.clientId));
    }
    if (filters?.status) {
      conditions.push(eq(trips.status, filters.status as any));
    }
    if (filters?.minDistance) {
      conditions.push(gte(trips.distanceKm, filters.minDistance.toString()));
    }
    if (filters?.maxDistance) {
      conditions.push(lte(trips.distanceKm, filters.maxDistance.toString()));
    }

    const result = await db.query.trips.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        driver: true,
        client: true,
      },
      orderBy: [desc(trips.tripDate)],
      limit: filters?.limit,
    });

    return result;
  }

  async getTrip(id: number, driverId?: string): Promise<TripWithRelations | undefined> {
    const conditions = [eq(trips.id, id)];
    if (driverId) {
      conditions.push(eq(trips.driverId, driverId));
    }
    
    const result = await db.query.trips.findFirst({
      where: and(...conditions),
      with: {
        driver: true,
        client: true,
      },
    });
    return result;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    // Calculate cost if client is specified
    let costCalculated: string | undefined;
    if (trip.clientId) {
      const client = await this.getClient(trip.clientId);
      if (client) {
        costCalculated = (Number(trip.distanceKm) * Number(client.ratePerKm)).toFixed(2);
      }
    }

    const [newTrip] = await db
      .insert(trips)
      .values({
        ...trip,
        costCalculated,
      })
      .returning();
    return newTrip;
  }

  async updateTrip(id: number, tripData: Partial<InsertTrip>, driverId?: string): Promise<Trip | undefined> {
    // Recalculate cost if distance or client changed
    let costCalculated: string | undefined;
    const existingTrip = await this.getTrip(id, driverId);
    
    if (!existingTrip) {
      return undefined;
    }
    
    // Prevent drivers from changing driverId
    const sanitizedData = { ...tripData };
    if (driverId) {
      delete sanitizedData.driverId;
    }
    
    const clientId = sanitizedData.clientId ?? existingTrip.clientId;
    const distance = sanitizedData.distanceKm ?? existingTrip.distanceKm;
    
    if (clientId) {
      const client = await this.getClient(clientId);
      if (client) {
        costCalculated = (Number(distance) * Number(client.ratePerKm)).toFixed(2);
      }
    }

    const conditions = [eq(trips.id, id)];
    if (driverId) {
      conditions.push(eq(trips.driverId, driverId));
    }

    const [updated] = await db
      .update(trips)
      .set({ 
        ...sanitizedData, 
        costCalculated,
        updatedAt: new Date() 
      })
      .where(and(...conditions))
      .returning();
    return updated;
  }

  async reviewTrip(id: number, status: "approved" | "rejected", adminNotes?: string): Promise<Trip | undefined> {
    const [updated] = await db
      .update(trips)
      .set({
        status,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(trips.id, id))
      .returning();
    return updated;
  }

  // Stats
  async getDriverStats(driverId: string): Promise<DriverStats> {
    const now = new Date();
    // Start of day in local time (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Start of week (Monday) at 00:00:00
    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const driverTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.driverId, driverId));

    const tripsToday = driverTrips.filter((t) => {
      const tripDate = new Date(t.tripDate);
      // Remove time for comparison to include everything on that calendar day
      const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate(), 0, 0, 0, 0);
      return tripDateOnly.getTime() === startOfDay.getTime();
    }).length;

    const tripsThisWeek = driverTrips.filter((t) => {
      const tripDate = new Date(t.tripDate);
      const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate(), 0, 0, 0, 0);
      return tripDateOnly >= startOfWeek;
    });

    const totalKmThisWeek = tripsThisWeek.reduce(
      (sum, t) => sum + (t.distanceKm ? Number(t.distanceKm) : 0),
      0
    );

    const pendingReports = driverTrips.filter(
      (t) => t.status === "draft" || t.status === "submitted"
    ).length;

    return {
      tripsToday,
      tripsThisWeek: tripsThisWeek.length,
      totalKmThisWeek,
      pendingReports,
    };
  }

  async getAdminStats(): Promise<AdminStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const allTrips = await db.query.trips.findMany({
      with: { client: true, driver: true },
    });

    const monthTrips = allTrips.filter((t) => {
      const tripDate = new Date(t.tripDate);
      const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate(), 0, 0, 0, 0);
      return tripDateOnly >= startOfMonth;
    });

    const totalTripsMonth = monthTrips.length;
    const totalKmMonth = monthTrips.reduce(
      (sum, t) => sum + (t.distanceKm ? Number(t.distanceKm) : 0),
      0
    );
    const totalRevenueMonth = monthTrips.reduce(
      (sum, t) => {
        const cost = t.cashAmount ? Number(t.cashAmount) : (t.costCalculated ? Number(t.costCalculated) : 0);
        return sum + cost;
      },
      0
    );

    const activeDriverIds = new Set(monthTrips.map((t) => t.driverId));
    const activeDrivers = activeDriverIds.size;

    const pendingReports = allTrips.filter((t) => t.status === "submitted").length;
    const approvedThisWeek = allTrips.filter(
      (t) => t.status === "approved" && new Date(t.updatedAt!) >= startOfWeek
    ).length;

    // Top clients
    const clientStats = new Map<string, { trips: number; revenue: number }>();
    monthTrips.forEach((t) => {
      if (t.client) {
        const key = t.client.name;
        const existing = clientStats.get(key) || { trips: 0, revenue: 0 };
        clientStats.set(key, {
          trips: existing.trips + 1,
          revenue: existing.revenue + (t.cashAmount ? Number(t.cashAmount) : (t.costCalculated ? Number(t.costCalculated) : 0)),
        });
      }
    });

    const topClients = Array.from(clientStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5);

    // Trips by day (last 7 days)
    const tripsByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTrips = allTrips.filter((t) => {
        const tripDate = new Date(t.tripDate);
        return tripDate >= dayStart && tripDate < dayEnd;
      });

      tripsByDay.push({
        date: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        count: dayTrips.length,
      });
    }

    // Trips by status
    const statusCounts = new Map<string, number>();
    allTrips.forEach((t) => {
      statusCounts.set(t.status, (statusCounts.get(t.status) || 0) + 1);
    });

    const tripsByStatus = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count })
    );

    return {
      totalTripsMonth,
      totalKmMonth,
      totalRevenueMonth,
      activeDrivers,
      pendingReports,
      approvedThisWeek,
      topClients,
      tripsByDay,
      tripsByStatus,
    };
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const allTrips = await db.query.trips.findMany({
      with: { client: true, driver: true },
    });

    const allClients = await db.select().from(clients);
    const allDrivers = await db.select().from(users).where(eq(users.role, "driver"));

    const totalTripsAllTime = allTrips.length;
    const totalKmAllTime = allTrips.reduce(
      (sum, t) => sum + (t.distanceKm ? Number(t.distanceKm) : 0),
      0
    );
    const totalRevenueAllTime = allTrips.reduce(
      (sum, t) => {
        const cost = t.cashAmount ? Number(t.cashAmount) : (t.costCalculated ? Number(t.costCalculated) : 0);
        return sum + cost;
      },
      0
    );
    const averageTripDistance = totalTripsAllTime > 0 ? totalKmAllTime / totalTripsAllTime : 0;
    const averageTripCost = totalTripsAllTime > 0 ? totalRevenueAllTime / totalTripsAllTime : 0;

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTrips = allTrips.filter((t) => {
        const tripDate = new Date(t.tripDate);
        return tripDate >= monthStart && tripDate <= monthEnd;
      });

      const revenue = monthTrips.reduce(
        (sum, t) => {
          const cost = t.cashAmount ? Number(t.cashAmount) : (t.costCalculated ? Number(t.costCalculated) : 0);
          return sum + cost;
        },
        0
      );

      revenueByMonth.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        revenue,
      });
    }

    // Distance by month (last 6 months)
    const distanceByMonth: { month: string; distance: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTrips = allTrips.filter((t) => {
        const tripDate = new Date(t.tripDate);
        return tripDate >= monthStart && tripDate <= monthEnd;
      });

      const distance = monthTrips.reduce(
        (sum, t) => sum + (t.distanceKm ? Number(t.distanceKm) : 0),
        0
      );

      distanceByMonth.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        distance,
      });
    }

    // Trips by driver
    const driverStats = new Map<string, number>();
    allTrips.forEach((t) => {
      const driverName = t.driver?.firstName
        ? `${t.driver.firstName} ${t.driver.lastName || ""}`.trim()
        : t.driver?.email || "Unknown";
      driverStats.set(driverName, (driverStats.get(driverName) || 0) + 1);
    });

    const tripsByDriver = Array.from(driverStats.entries())
      .map(([driver, trips]) => ({ driver, trips }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // Trips by client
    const clientStats = new Map<string, { trips: number; revenue: number }>();
    allTrips.forEach((t) => {
      if (t.client) {
        const key = t.client.name;
        const existing = clientStats.get(key) || { trips: 0, revenue: 0 };
        clientStats.set(key, {
          trips: existing.trips + 1,
          revenue: existing.revenue + (t.cashAmount ? Number(t.cashAmount) : (t.costCalculated ? Number(t.costCalculated) : 0)),
        });
      }
    });

    const tripsByClient = Array.from(clientStats.entries())
      .map(([client, stats]) => ({ client, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalTripsAllTime,
      totalKmAllTime,
      totalRevenueAllTime,
      averageTripDistance,
      averageTripCost,
      totalClients: allClients.filter((c) => c.status === "active").length,
      totalDrivers: allDrivers.length,
      revenueByMonth,
      tripsByDriver,
      tripsByClient,
      distanceByMonth,
    };
  }
}

export const storage = new DatabaseStorage();
