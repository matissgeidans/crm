import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { StatsCard } from "@/components/stats-card";
import { TripForm } from "@/components/trip-form";
import { TripTable } from "@/components/trip-table";
import { TripDetailsDialog } from "@/components/trip-details-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardList, 
  Gauge, 
  TrendingUp, 
  Plus,
  Calendar as CalendarIcon
} from "lucide-react";
import type { TripWithRelations } from "@shared/schema";

interface DriverStats {
  tripsToday: number;
  tripsThisWeek: number;
  totalKmThisWeek: number;
  pendingReports: number;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripWithRelations | null>(null);
  const [viewTrip, setViewTrip] = useState<TripWithRelations | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DriverStats>({
    queryKey: ["/api/stats/driver"],
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery<TripWithRelations[]>({
    queryKey: ["/api/trips"],
  });

  const handleEditTrip = (trip: TripWithRelations) => {
    setSelectedTrip(trip);
    setShowForm(true);
  };

  const handleNewTrip = () => {
    setSelectedTrip(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTrip(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Manage your daily towing trip reports
          </p>
        </div>
        <Button onClick={handleNewTrip} data-testid="button-new-trip">
          <Plus className="mr-2 h-4 w-4" />
          Log New Trip
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Trips Today"
          value={stats?.tripsToday ?? 0}
          icon={ClipboardList}
          isLoading={statsLoading}
          testId="stats-trips-today"
        />
        <StatsCard
          title="This Week"
          value={stats?.tripsThisWeek ?? 0}
          description="trips logged"
          icon={CalendarIcon}
          isLoading={statsLoading}
          testId="stats-trips-week"
        />
        <StatsCard
          title="Total Distance"
          value={`${stats?.totalKmThisWeek?.toFixed(1) ?? 0} km`}
          description="this week"
          icon={Gauge}
          isLoading={statsLoading}
          testId="stats-distance-week"
        />
        <StatsCard
          title="Pending Reports"
          value={stats?.pendingReports ?? 0}
          description="awaiting review"
          icon={TrendingUp}
          isLoading={statsLoading}
          testId="stats-pending"
        />
      </div>

      <Tabs defaultValue={showForm ? "new" : "trips"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips" data-testid="tab-trips">My Trips</TabsTrigger>
          <TabsTrigger value="new" data-testid="tab-new-trip">
            {selectedTrip ? "Edit Trip" : "New Trip"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <TripTable
                trips={trips}
                isLoading={tripsLoading}
                onEdit={handleEditTrip}
                onView={setViewTrip}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <TripForm
            trip={selectedTrip || undefined}
            onSuccess={handleFormSuccess}
          />
        </TabsContent>
      </Tabs>

      <TripDetailsDialog
        trip={viewTrip}
        open={!!viewTrip}
        onOpenChange={() => setViewTrip(null)}
      />
    </div>
  );
}
