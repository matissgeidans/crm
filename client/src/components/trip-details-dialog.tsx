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
  Truck, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Building2,
  FileText,
  Clock,
  Package,
  CreditCard
} from "lucide-react";
import type { TripWithRelations } from "@shared/schema";

interface TripDetailsDialogProps {
  trip: TripWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  draft: { variant: "secondary", label: "Melnraksts" },
  submitted: { variant: "default", label: "Iesniegts" },
  approved: { variant: "outline", label: "Apstiprināts" },
  rejected: { variant: "destructive", label: "Noraidīts" },
};

export function TripDetailsDialog({ trip, open, onOpenChange }: TripDetailsDialogProps) {
  if (!trip) return null;

  const status = statusStyles[trip.status] || statusStyles.draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-8 border-none overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-100">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800">
                Brauciena informācija
              </DialogTitle>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Sistēmas ID: {trip.id}
                </p>
                {trip.tripNumber && (
                  <p className="text-sm font-black text-orange-600">
                    Izsaukuma nr: {trip.tripNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Badge variant={status.variant} className="rounded-full px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
            {status.label}
          </Badge>
        </DialogHeader>

        <div className="grid gap-8 py-6">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-3xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Datums</p>
              <div className="flex items-center gap-2 font-black text-slate-800">
                <Calendar className="h-4 w-4 text-orange-500" />
                {format(new Date(trip.tripDate), "dd.MM.yyyy HH:mm")}
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Klients</p>
              <div className="flex items-center gap-2 font-black text-slate-800">
                <Building2 className="h-4 w-4 text-orange-500" />
                <span className="truncate">{trip.client?.name || trip.manualClientName || "-"}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Location & Trip details */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-50 p-2.5 rounded-full">
                <MapPin className="h-4 w-4 text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Maršruts / Apraksts</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {trip.pickupLocation || "Nav norādīts"}
                </p>
                {(trip.isTalaRiga || trip.isPieriga) && (
                  <div className="flex gap-2 pt-1">
                    {trip.isTalaRiga && <Badge className="bg-orange-100 text-orange-600 rounded-lg text-[9px]">Tālā Rīga</Badge>}
                    {trip.isPieriga && <Badge className="bg-orange-100 text-orange-600 rounded-lg text-[9px]">Pierīga</Badge>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-orange-50 p-2.5 rounded-full">
                <Truck className="h-4 w-4 text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Transportlīdzeklis & Krava</p>
                <p className="text-sm font-bold text-slate-700">
                  {trip.cargoName || "-"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold text-[10px]">
                    NR: {trip.licensePlate}
                  </Badge>
                  {trip.weightCategory && (
                    <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold text-[10px]">
                      SVARS: {trip.weightCategory}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Attālums</p>
              <p className="text-xl font-black text-slate-800">{trip.distanceKm} km</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Laiks</p>
              <p className="text-xl font-black text-slate-800">{trip.durationHours || 0} h</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Papildus izdevumi</p>
              <p className="text-xl font-black text-slate-800">{trip.extraCosts || "0.00"} €</p>
            </div>
          </div>

          {/* Services & Payment */}
          <div className="bg-slate-50 p-8 rounded-[40px] space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pakalpojumi</p>
              <div className="flex flex-wrap gap-3">
                {trip.hasRati && (
                  <Badge className="bg-white text-slate-800 border-none shadow-sm rounded-xl px-4 py-2 font-bold flex items-center gap-2">
                    <Package className="h-3 w-3 text-orange-500" /> Ratiņi {trip.ratiType && `(${trip.ratiType})`}
                  </Badge>
                )}
                {trip.hasTehniskaPalidziba && (
                  <Badge className="bg-white text-slate-800 border-none shadow-sm rounded-xl px-4 py-2 font-bold flex items-center gap-2">
                    <Truck className="h-3 w-3 text-orange-500" /> Tehniskā palīdzība
                  </Badge>
                )}
                {trip.hasDarbsNakti && (
                  <Badge className="bg-white text-slate-800 border-none shadow-sm rounded-xl px-4 py-2 font-bold flex items-center gap-2">
                    <Clock className="h-3 w-3 text-orange-500" /> Darbs naktī
                  </Badge>
                )}
                {!trip.hasRati && !trip.hasTehniskaPalidziba && !trip.hasDarbsNakti && (
                  <p className="text-xs text-slate-400 italic">Nav norādīti papildus pakalpojumi</p>
                )}
              </div>
            </div>

            <Separator className="bg-slate-200/50" />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Norēķina veids</p>
                <div className="flex items-center gap-2 font-black text-slate-800">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  {trip.paymentType || "-"}
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Summa</p>
                <p className="text-3xl font-black text-orange-500">
                  {trip.cashAmount || trip.costCalculated || "0.00"} €
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(trip.notes || trip.paymentNotes) && (
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Piezīmes</p>
              <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
                {trip.notes && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Reisa piezīmes:</p>
                    <p className="text-sm text-slate-600">{trip.notes}</p>
                  </div>
                )}
                {trip.paymentNotes && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Norēķinu piezīmes:</p>
                    <p className="text-sm text-slate-600">{trip.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
