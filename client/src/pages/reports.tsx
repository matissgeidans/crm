import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { TripTable } from "@/components/trip-table";
import { TripDetailsDialog } from "@/components/trip-details-dialog";
import { TripForm } from "@/components/trip-form";
import { ReportFiltersPanel, type ReportFilters } from "@/components/report-filters";
import { ExportButtons } from "@/components/export-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Filter } from "lucide-react";
import type { TripWithRelations, Client, User } from "@shared/schema";

export default function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [viewTrip, setViewTrip] = useState<TripWithRelations | null>(null);
  const [editTrip, setEditTrip] = useState<TripWithRelations | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate.toISOString());
    if (filters.endDate) params.set("endDate", filters.endDate.toISOString());
    if (filters.driverId) params.set("driverId", filters.driverId);
    if (filters.clientId) params.set("clientId", filters.clientId.toString());
    if (filters.status) params.set("status", filters.status);
    if (filters.minDistance) params.set("minDistance", filters.minDistance.toString());
    if (filters.maxDistance) params.set("maxDistance", filters.maxDistance.toString());
    return params.toString();
  };

  const { data: trips = [], isLoading: tripsLoading } = useQuery<TripWithRelations[]>({
    queryKey: ["/api/trips/all", filters],
    queryFn: async () => {
      const query = buildQueryString();
      const res = await fetch(`/api/trips/all${query ? `?${query}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/drivers"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ tripId, action, notes }: { tripId: number; action: "approve" | "reject"; notes?: string }) => {
      return apiRequest("PATCH", `/api/trips/${tripId}/review`, { action, adminNotes: notes });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: variables.action === "approve" ? "Trip Approved" : "Trip Rejected",
        description: `The trip report has been ${variables.action}d.`,
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update trip status.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (tripId: number, notes?: string) => {
    reviewMutation.mutate({ tripId, action: "approve", notes });
  };

  const handleReject = (tripId: number, notes?: string) => {
    reviewMutation.mutate({ tripId, action: "reject", notes });
  };

  if (editTrip) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditTrip(null)}
            data-testid="button-back-edit"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Trip Report</h1>
        </div>
        <TripForm
          trip={editTrip}
          onSuccess={() => setEditTrip(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Reports</h1>
          <p className="text-muted-foreground">
            View and manage all driver trip reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <ExportButtons filters={filters} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {showFilters && (
          <div className="lg:col-span-1">
            <ReportFiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
              clients={clients}
              drivers={drivers}
            />
          </div>
        )}

        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Trip Reports</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {trips.length} {trips.length === 1 ? "report" : "reports"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TripTable
                trips={trips}
                isLoading={tripsLoading}
                onEdit={setEditTrip}
                onView={setViewTrip}
                onApprove={handleApprove}
                onReject={handleReject}
                showDriver
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <TripDetailsDialog
        trip={viewTrip}
        open={!!viewTrip}
        onOpenChange={() => setViewTrip(null)}
      />
    </div>
  );
}
