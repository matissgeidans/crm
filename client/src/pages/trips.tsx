import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { TripForm } from "@/components/trip-form";
import { TripTable } from "@/components/trip-table";
import { TripDetailsDialog } from "@/components/trip-details-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import type { TripWithRelations } from "@shared/schema";

export default function TripsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTrip, setSelectedTrip] = useState<TripWithRelations | null>(null);
  const [viewTrip, setViewTrip] = useState<TripWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: trips = [], isLoading } = useQuery<TripWithRelations[]>({
    queryKey: ["/api/trips"],
  });

  const handleEdit = (trip: TripWithRelations) => {
    setSelectedTrip(trip);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTrip(null);
  };

  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowForm(false);
              setSelectedTrip(null);
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {selectedTrip ? "Edit Trip" : "Log New Trip"}
          </h1>
        </div>
        <TripForm
          trip={selectedTrip || undefined}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">
            View and manage your trip reports
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-new-trip-page">
          <Plus className="mr-2 h-4 w-4" />
          Log New Trip
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip History</CardTitle>
        </CardHeader>
        <CardContent>
          <TripTable
            trips={trips}
            isLoading={isLoading}
            onEdit={handleEdit}
            onView={setViewTrip}
          />
        </CardContent>
      </Card>

      <TripDetailsDialog
        trip={viewTrip}
        open={!!viewTrip}
        onOpenChange={() => setViewTrip(null)}
      />
    </div>
  );
}
