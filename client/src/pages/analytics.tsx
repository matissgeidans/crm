import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Truck,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  Target,
} from "lucide-react";

interface AnalyticsData {
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

const COLORS = [
  "hsl(217, 91%, 35%)",
  "hsl(142, 76%, 36%)",
  "hsl(262, 83%, 38%)",
  "hsl(39, 100%, 45%)",
  "hsl(345, 83%, 41%)",
  "hsl(200, 80%, 40%)",
  "hsl(30, 90%, 50%)",
];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of your towing operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Trips"
          value={analytics?.totalTripsAllTime?.toLocaleString() ?? 0}
          description="all time"
          icon={Truck}
          testId="analytics-total-trips"
        />
        <StatsCard
          title="Total Distance"
          value={`${(analytics?.totalKmAllTime ?? 0).toLocaleString()} km`}
          description="all time"
          icon={Activity}
          testId="analytics-total-distance"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(analytics?.totalRevenueAllTime ?? 0).toLocaleString()}`}
          description="all time"
          icon={DollarSign}
          testId="analytics-total-revenue"
        />
        <StatsCard
          title="Avg Trip Distance"
          value={`${(analytics?.averageTripDistance ?? 0).toFixed(1)} km`}
          icon={Target}
          testId="analytics-avg-distance"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Average Trip Cost"
          value={`$${(analytics?.averageTripCost ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          testId="analytics-avg-cost"
        />
        <StatsCard
          title="Active Clients"
          value={analytics?.totalClients ?? 0}
          icon={Users}
          testId="analytics-clients"
        />
        <StatsCard
          title="Active Drivers"
          value={analytics?.totalDrivers ?? 0}
          icon={Users}
          testId="analytics-drivers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.revenueByMonth || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distance Traveled</CardTitle>
            <CardDescription>Monthly distance in kilometers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.distanceByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value} km`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} km`, "Distance"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="distance"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trips by Driver</CardTitle>
            <CardDescription>Driver performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analytics?.tripsByDriver?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.tripsByDriver} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="driver"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="trips" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No driver data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Client</CardTitle>
            <CardDescription>Top clients by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analytics?.tripsByClient?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.tripsByClient.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="revenue"
                      nameKey="client"
                      label={({ client, revenue }) => `${client}: $${revenue.toLocaleString()}`}
                      labelLine={false}
                    >
                      {analytics.tripsByClient.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No client data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
