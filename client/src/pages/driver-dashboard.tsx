import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { TripForm } from "@/components/trip-form";
import { TripDetailsDialog } from "@/components/trip-details-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Truck,
  MapPin,
  Clock,
  CreditCard,
  Edit2
} from "lucide-react";
import type { TripWithRelations } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DriverStats {
  tripsToday: number;
  totalKmToday: number;
  tripsThisWeek: number;
  totalKmThisWeek: number;
  pendingReports: number;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripWithRelations | null>(null);
  const [viewTrip, setViewTrip] = useState<TripWithRelations | null>(null);

  const { data: stats } = useQuery<DriverStats>({
    queryKey: ["/api/stats/driver"],
  });

  const { data: trips = [] } = useQuery<TripWithRelations[]>({
    queryKey: ["/api/trips"],
  });

  const handleEditTrip = (trip: TripWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrip(trip);
    setShowForm(true);
  };

  const handleNewTrip = () => {
    setSelectedTrip(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="p-6">
          <TripForm
            trip={selectedTrip || undefined}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
            driverName={user?.firstName ? `${user.firstName} ${user.lastName || ""}` : undefined}
            driverVehicle={user?.vehicleName || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            Labvakar, {user?.firstName || "Lietotājs"}! <span className="text-3xl">👋</span>
          </h1>
          <p className="text-slate-500 font-medium">
            {new Date().toLocaleDateString("lv-LV", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={handleNewTrip} 
            className="rounded-full h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-100 border-none"
          >
            <Plus className="mr-2 h-5 w-5" />
            Jauns izsaukums
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <h2>Šodienas rezultāti</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-orange-500 text-white border-none shadow-xl shadow-orange-100 rounded-3xl overflow-hidden relative group">
            <CardContent className="p-8 space-y-2">
              <p className="text-orange-100 font-bold text-sm">Braucieni</p>
              <h3 className="text-5xl font-black">{stats?.tripsToday ?? 0}</h3>
              <div className="absolute top-6 right-6 bg-white/20 p-3 rounded-2xl">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden relative group">
            <CardContent className="p-8 space-y-2">
              <p className="text-slate-400 font-bold text-sm">Šodien nobraukti</p>
              <h3 className="text-5xl font-black text-slate-800">{stats?.totalKmToday?.toFixed(0) ?? 0}</h3>
              <p className="text-slate-400 font-bold text-sm">km</p>
              <div className="absolute top-6 right-6 bg-orange-50/10 p-3 rounded-2xl">
                <MapPin className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Mani braucieni</h2>
          <Button variant="outline" className="text-orange-500 border-orange-200 font-bold hover:bg-orange-50">Skatīt visus</Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {trips.length === 0 ? (
            <p className="text-slate-400 col-span-full py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">Nav atrasts neviens brauciens.</p>
          ) : (
            trips.map((trip) => (
              <Card 
                key={trip.id} 
                className="group border-none shadow-sm rounded-3xl hover:shadow-md transition-all cursor-pointer bg-white relative"
                onClick={() => setViewTrip(trip)}
              >
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-100 group-hover:scale-105 transition-transform">
                        <Truck className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-slate-800 truncate max-w-[120px]">
                          {trip.client?.name || trip.manualClientName || "Klients"}
                        </h4>
                        <p className="text-xs text-slate-400 font-bold">
                          {new Date(trip.tripDate).toLocaleDateString("lv-LV", { day: "numeric", month: "long" })}, {new Date(trip.tripDate).toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {trip.tripNumber && (
                          <p className="text-[10px] font-bold text-orange-500 uppercase">
                            NR: {trip.tripNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                        trip.status === "approved" ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      )}>
                        {trip.status === "approved" ? "Apstiprināts" : "Iesniegts"}
                      </Badge>
                      {(trip.status === "draft" || trip.status === "submitted") && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full hover:bg-orange-50 text-slate-400 hover:text-orange-500"
                          onClick={(e) => handleEditTrip(trip, e)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-slate-300" />
                      <div className="flex flex-col">
                        <span className="truncate">{trip.pickupLocation || "Nav norādīts"}</span>
                        {(trip.isTalaRiga || trip.isPieriga) && (
                          <div className="flex gap-2 pt-1">
                            {trip.isTalaRiga && <Badge className="bg-orange-100 text-orange-600 rounded-lg text-[9px] h-4">Tālā Rīga</Badge>}
                            {trip.isPieriga && <Badge className="bg-orange-100 text-orange-600 rounded-lg text-[9px] h-4">Pierīga</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <Truck className="h-4 w-4 text-slate-300" />
                      <span className="truncate">{trip.cargoName || "Krava"} • {trip.licensePlate}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-50 p-2.5 rounded-full">
                        <MapPin className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Attālums</p>
                        <p className="text-sm font-black text-slate-800">{trip.distanceKm} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-50 p-2.5 rounded-full">
                        <Clock className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Laiks</p>
                        <p className="text-sm font-black text-slate-800">{trip.durationHours || 0} h</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {trip.paymentType && (
                      <Badge variant="outline" className="rounded-xl bg-slate-50 border-slate-100 text-slate-500 font-bold px-3 py-1.5 flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> {trip.paymentType}
                      </Badge>
                    )}
                    {(trip.status === "approved" || trip.paymentType === "Skaidrā nauda") && (
                      <Badge variant="outline" className="rounded-xl bg-emerald-50 border-emerald-100 text-emerald-600 font-bold px-3 py-1.5">
                        {trip.cashAmount || trip.costCalculated} €
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-10 right-10">
        <Button 
          onClick={handleNewTrip}
          className="rounded-full h-16 px-10 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-2xl shadow-orange-300 transform hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-none"
        >
          <Plus className="h-6 w-6" />
          Jauns izsaukums
        </Button>
      </div>

      <TripDetailsDialog
        trip={viewTrip}
        open={!!viewTrip}
        onOpenChange={() => setViewTrip(null)}
      />
    </div>
  );
}
