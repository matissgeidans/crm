import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import type { TripWithRelations } from "@shared/schema";

interface TripTableProps {
  trips: TripWithRelations[];
  isLoading?: boolean;
  onEdit?: (trip: TripWithRelations) => void;
  onView?: (trip: TripWithRelations) => void;
  onApprove?: (tripId: number, notes?: string) => void;
  onReject?: (tripId: number, notes?: string) => void;
  showDriver?: boolean;
}

const statusStyles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  draft: { variant: "secondary", label: "Draft" },
  submitted: { variant: "default", label: "Submitted" },
  approved: { variant: "outline", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
};

export function TripTable({
  trips,
  isLoading,
  onEdit,
  onView,
  onApprove,
  onReject,
  showDriver = false,
}: TripTableProps) {
  const { isAdmin } = useAuth();
  const [reviewDialog, setReviewDialog] = useState<{
    type: "approve" | "reject";
    tripId: number;
  } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const handleReview = () => {
    if (!reviewDialog) return;
    
    if (reviewDialog.type === "approve") {
      onApprove?.(reviewDialog.tripId, adminNotes);
    } else {
      onReject?.(reviewDialog.tripId, adminNotes);
    }
    
    setReviewDialog(null);
    setAdminNotes("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No trips found</h3>
        <p className="text-sm text-muted-foreground">
          {showDriver
            ? "No trip reports match your current filters."
            : "You haven't logged any trips yet. Start by creating a new trip."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showDriver && <TableHead>Driver</TableHead>}
              <TableHead>Vehicle</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Distance</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => {
              const status = statusStyles[trip.status] || statusStyles.draft;
              return (
                <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                  <TableCell className="font-medium">
                    {format(new Date(trip.tripDate), "MMM d, yyyy")}
                    <span className="block text-xs text-muted-foreground">
                      {format(new Date(trip.tripDate), "HH:mm")}
                    </span>
                  </TableCell>
                  {showDriver && (
                    <TableCell>
                      {trip.driver?.firstName
                        ? `${trip.driver.firstName} ${trip.driver.lastName || ""}`
                        : trip.driver?.email || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="font-medium">
                      {trip.vehicleMake} {trip.vehicleModel}
                    </span>
                    {trip.vehicleColor && (
                      <span className="block text-xs text-muted-foreground">
                        {trip.vehicleColor}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm uppercase">
                    {trip.licensePlate}
                  </TableCell>
                  <TableCell>{trip.client?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    {Number(trip.distanceKm).toFixed(1)} km
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {trip.costCalculated
                      ? `$${Number(trip.costCalculated).toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-trip-actions-${trip.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onView?.(trip)}
                          data-testid={`action-view-${trip.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {(trip.status === "draft" || isAdmin) && (
                          <DropdownMenuItem
                            onClick={() => onEdit?.(trip)}
                            data-testid={`action-edit-${trip.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Trip
                          </DropdownMenuItem>
                        )}
                        {isAdmin && trip.status === "submitted" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setReviewDialog({ type: "approve", tripId: trip.id })
                              }
                              data-testid={`action-approve-${trip.id}`}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setReviewDialog({ type: "reject", tripId: trip.id })
                              }
                              data-testid={`action-reject-${trip.id}`}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.type === "approve" ? "Approve Trip" : "Reject Trip"}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.type === "approve"
                ? "This will approve the trip report. You can add notes below."
                : "Please provide a reason for rejecting this trip report."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder={
                  reviewDialog?.type === "approve"
                    ? "Optional notes..."
                    : "Reason for rejection..."
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                data-testid="input-admin-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              variant={reviewDialog?.type === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-review"
            >
              {reviewDialog?.type === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
