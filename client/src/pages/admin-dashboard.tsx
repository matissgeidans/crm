import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Truck,
  DollarSign,
  Users,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { TripWithRelations, Client } from "@shared/schema";

interface AdminStats {
  totalTripsToday: number;
  totalKmToday: number;
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

const COLORS = ["hsl(217, 91%, 35%)", "hsl(142, 76%, 36%)", "hsl(262, 83%, 38%)", "hsl(39, 100%, 45%)", "hsl(345, 83%, 41%)"];

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/stats/admin"],
  });

  const { data: recentTrips = [], isLoading: tripsLoading } = useQuery<TripWithRelations[]>({
    queryKey: ["/api/trips", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/trips?limit=5&status=submitted");
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your towing operations
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Trips (Month)"
          value={stats?.totalTripsMonth ?? 0}
          icon={ClipboardList}
          isLoading={statsLoading}
          testId="stats-total-trips"
        />
        <StatsCard
          title="Total Distance"
          value={`${(stats?.totalKmMonth ?? 0).toFixed(0)} km`}
          description="this month"
          icon={Truck}
          isLoading={statsLoading}
          testId="stats-total-distance"
        />
        <StatsCard
          title="Estimated Revenue"
          value={`$${(stats?.totalRevenueMonth ?? 0).toLocaleString()}`}
          description="this month"
          icon={DollarSign}
          isLoading={statsLoading}
          testId="stats-revenue"
        />
        <StatsCard
          title="Pending Reports"
          value={stats?.pendingReports ?? 0}
          description="awaiting review"
          icon={TrendingUp}
          isLoading={statsLoading}
          testId="stats-pending-admin"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trips This Week</CardTitle>
            <CardDescription>Daily trip count for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.tripsByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip Status Distribution</CardTitle>
            <CardDescription>Breakdown of trip report statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.tripsByStatus || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {stats?.tripsByStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>By trip volume this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/clients">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : stats?.topClients?.length ? (
              <div className="space-y-4">
                {stats.topClients.map((client, index) => (
                  <div
                    key={client.name}
                    className="flex items-center justify-between"
                    data-testid={`top-client-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.trips} trips
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ${client.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No client data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>Awaiting your review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : recentTrips.length ? (
              <div className="space-y-4">
                {recentTrips.slice(0, 5).map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between"
                    data-testid={`pending-trip-${trip.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {trip.cargoName || "Nav norādīts"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trip.driver?.firstName || trip.driver?.email || "Nezināms vadītājs"} - {Number(trip.distanceKm).toFixed(1)} km
                      </p>
                    </div>
                    <span className="text-sm font-mono uppercase text-muted-foreground">
                      {trip.licensePlate}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending reports</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
