import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Car, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Building2,
  FileText,
  Gauge
} from "lucide-react";
import type { TripWithRelations } from "@shared/schema";

interface TripDetailsDialogProps {
  trip: TripWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  draft: { variant: "secondary", label: "Draft" },
  submitted: { variant: "default", label: "Submitted" },
  approved: { variant: "outline", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
};

export function TripDetailsDialog({ trip, open, onOpenChange }: TripDetailsDialogProps) {
  if (!trip) return null;

  const status = statusStyles[trip.status] || statusStyles.draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Trip Details</DialogTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Date & Time
            </div>
            <p className="text-lg font-medium">
              {format(new Date(trip.tripDate), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Car className="h-4 w-4" />
              Vehicle Information
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Make/Model:</span>
                <span className="font-medium">{trip.vehicleMake} {trip.vehicleModel}</span>
              </div>
              {trip.vehicleColor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <span>{trip.vehicleColor}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Plate:</span>
                <span className="font-mono font-medium uppercase">{trip.licensePlate}</span>
              </div>
              {trip.vehicleDescription && (
                <div className="pt-2">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1 text-sm">{trip.vehicleDescription}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Locations
            </div>
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Pickup:</span>
                <p className="font-medium">{trip.pickupLocation || "Not specified"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Drop-off:</span>
                <p className="font-medium">{trip.dropoffLocation || "Not specified"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gauge className="h-4 w-4" />
                Distance
              </div>
              <p className="text-2xl font-bold">{Number(trip.distanceKm).toFixed(1)} km</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Cost
              </div>
              <p className="text-2xl font-bold">
                {trip.costCalculated 
                  ? `$${Number(trip.costCalculated).toFixed(2)}` 
                  : "—"}
              </p>
            </div>
          </div>

          {trip.client && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Client
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{trip.client.name}</p>
                  <span className="text-sm text-muted-foreground">
                    ${trip.client.ratePerKm}/km
                  </span>
                </div>
              </div>
            </>
          )}

          {trip.driver && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Driver
                </div>
                <p className="font-medium">
                  {trip.driver.firstName
                    ? `${trip.driver.firstName} ${trip.driver.lastName || ""}`
                    : trip.driver.email}
                </p>
              </div>
            </>
          )}

          {(trip.notes || trip.adminNotes) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
                {trip.notes && (
                  <div>
                    <span className="text-xs text-muted-foreground">Driver Notes:</span>
                    <p className="text-sm mt-1">{trip.notes}</p>
                  </div>
                )}
                {trip.adminNotes && (
                  <div>
                    <span className="text-xs text-muted-foreground">Admin Notes:</span>
                    <p className="text-sm mt-1">{trip.adminNotes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
