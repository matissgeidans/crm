import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Send, MapPin, Truck, Package, PlusCircle, CreditCard, ChevronLeft, Upload } from "lucide-react";
import type { Client, Trip } from "@shared/schema";
import { cn } from "@/lib/utils";

const tripFormSchema = z.object({
  tripNumber: z.string().optional(),
  clientId: z.string().optional(),
  manualClientName: z.string().optional(),
  vehicleId: z.string().optional(),
  cargoName: z.string().min(1, "Krava / Transportlīdzeklis ir obligāts"),
  weightCategory: z.string().optional(),
  licensePlate: z.string().min(1, "Numura zīme ir obligāta"),
  distanceKm: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Attālumam jābūt skaitlim",
  }),
  durationHours: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  isTalaRiga: z.boolean().default(false),
  isPieriga: z.boolean().default(false),
  hasRati: z.boolean().default(false),
  ratiType: z.string().optional(),
  hasTehniskaPalidziba: z.boolean().default(false),
  hasDarbsNakti: z.boolean().default(false),
  paymentType: z.string().optional(),
  cashAmount: z.string().optional(),
  extraCosts: z.string().optional(),
  extraCostsDescription: z.string().optional(),
  tripDate: z.string(),
  notes: z.string().optional(),
  paymentNotes: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

interface TripFormProps {
  trip?: Trip;
  onSuccess?: () => void;
  onCancel?: () => void;
  driverName?: string;
  driverVehicle?: string;
}

type Tab = "Izsaukums" | "Reiss" | "Papildus" | "Norēķins";

export function TripForm({ trip, onSuccess, onCancel, driverName, driverVehicle }: TripFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Izsaukums");

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const activeClients = clients.filter((c) => c.status === "active");

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      tripNumber: trip?.tripNumber || "",
      clientId: trip?.clientId?.toString() || "",
      manualClientName: trip?.manualClientName || "",
      vehicleId: trip?.vehicleId || driverVehicle || "",
      cargoName: trip?.cargoName || "",
      weightCategory: trip?.weightCategory || "0-5T",
      licensePlate: trip?.licensePlate || "",
      distanceKm: trip?.distanceKm?.toString() || "0",
      durationHours: trip?.durationHours?.toString() || "0",
      pickupLocation: trip?.pickupLocation || "",
      dropoffLocation: trip?.dropoffLocation || "",
      isTalaRiga: trip?.isTalaRiga || false,
      isPieriga: trip?.isPieriga || false,
      hasRati: trip?.hasRati || false,
      ratiType: trip?.ratiType || "1",
      hasTehniskaPalidziba: trip?.hasTehniskaPalidziba || false,
      hasDarbsNakti: trip?.hasDarbsNakti || false,
      paymentType: trip?.paymentType || "Skaidrā nauda",
      cashAmount: trip?.cashAmount?.toString() || "",
      extraCosts: trip?.extraCosts?.toString() || "0.00",
      extraCostsDescription: trip?.extraCostsDescription || "",
      tripDate: trip?.tripDate
        ? new Date(trip.tripDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      notes: trip?.notes || "",
      paymentNotes: trip?.paymentNotes || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TripFormValues & { status: string }) => {
      const payload = {
        ...data,
        clientId: data.clientId ? parseInt(data.clientId) : null,
        tripDate: new Date(data.tripDate).toISOString(),
      };
      
      if (trip?.id) {
        return apiRequest("PATCH", `/api/trips/${trip.id}`, payload);
      }
      return apiRequest("POST", "/api/trips", payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: variables.status === "submitted" ? "Izsaukums iesniegts" : "Melnraksts saglabāts",
        description: variables.status === "submitted" 
          ? "Jūsu ziņojums ir nosūtīts pārbaudei." 
          : "Izsaukums saglabāts kā melnraksts.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Kļūda",
        description: "Neizdevās saglabāt datus. Lūdzu mēģiniet vēlreiz.",
        variant: "destructive",
      });
    },
  });

  const onSaveDraft = () => {
    const values = form.getValues();
    saveMutation.mutate({ ...values, status: "draft" });
  };

  const onSubmit = (data: TripFormValues) => {
    saveMutation.mutate({ ...data, status: "submitted" });
  };

  const clientId = form.watch("clientId");
  const manualClientName = form.watch("manualClientName");
  const hasRati = form.watch("hasRati");
  const paymentType = form.watch("paymentType");

  const selectedClient = activeClients.find(
    (c) => c.id.toString() === clientId
  );
  
  const displayClientName = selectedClient?.name || manualClientName || "-";
  const totalDistance = parseFloat(form.watch("distanceKm") || "0");

  const tabs: Tab[] = ["Izsaukums", "Reiss", "Papildus", "Norēķins"];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{trip ? "Labot izsaukumu" : "Jauns izsaukums"}</h1>
          <p className="text-sm text-muted-foreground">
            Vadītājs: {driverName || "Lietotājs"} • {driverVehicle || "Nav norādīts"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            className={cn(
              "rounded-full px-6 py-2 h-auto text-sm transition-all",
              activeTab === tab ? "bg-orange-500 hover:bg-orange-600 border-none text-white shadow-md" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Izsaukums" && <MapPin className="mr-2 h-4 w-4" />}
            {tab === "Reiss" && <Truck className="mr-2 h-4 w-4" />}
            {tab === "Papildus" && <Package className="mr-2 h-4 w-4" />}
            {tab === "Norēķins" && <CreditCard className="mr-2 h-4 w-4" />}
            {tab}
          </Button>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {activeTab === "Izsaukums" && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tripDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold">Datums</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold">Transportlīdzeklis</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50">
                                <SelectValue placeholder="Izvēlies auto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={driverVehicle || "default"}>{driverVehicle || "Auto"}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Klients</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50">
                              <SelectValue placeholder="Izvēlieties klientu..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeClients.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manualClientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Vai ievadiet klientu manuāli</FormLabel>
                        <FormControl>
                          <Input placeholder="Klienta nosaukums..." {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tripNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Izsaukuma nr.</FormLabel>
                        <FormControl>
                          <Input placeholder="piem. 12345" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Izsaukuma apraksts</FormLabel>
                        <FormControl>
                          <Textarea placeholder="No kurienes - uz kurieni (piem. BIKERNIEKU TRASE - ULMAŅA 1)" className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="isTalaRiga"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox id="tala-riga" checked={field.value} onCheckedChange={field.onChange} className="rounded-full border-orange-400 data-[state=checked]:bg-orange-500" />
                          <Label htmlFor="tala-riga" className="text-slate-600 font-medium">Tālā Rīga</Label>
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isPieriga"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox id="pieriga" checked={field.value} onCheckedChange={field.onChange} className="rounded-full border-orange-400 data-[state=checked]:bg-orange-500" />
                          <Label htmlFor="pieriga" className="text-slate-600 font-medium">Pierīga</Label>
                        </div>
                      )}
                    />
                  </div>
                </div>
              )}

              {activeTab === "Reiss" && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cargoName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Krava / Transportlīdzeklis</FormLabel>
                        <FormControl>
                          <Input placeholder="piem. CUPRA TERRAMAR, BMW X5" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightCategory"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-slate-600 font-semibold">Svara kategorija</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                          >
                            {["0-5T", "5-10T", "10-15T"].map((val) => (
                              <div key={val} className="flex items-center space-x-2">
                                <RadioGroupItem value={val} id={val} className="border-orange-400 text-orange-500" />
                                <Label htmlFor={val} className="text-slate-600">{val}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Numura zīme</FormLabel>
                        <FormControl>
                          <Input placeholder="PIEM. AB1234" {...field} className="rounded-xl border-slate-100 bg-slate-50/50 uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="distanceKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" /> Attālums (km)
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold flex items-center gap-2">
                            <Loader2 className="h-4 w-4 text-slate-400" /> Laiks (h)
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-600 font-semibold">Pakalpojumi</Label>
                    <div className="space-y-3">
                      {[
                        { id: "hasRati", label: "Ratiņi", desc: "Izmantoti ratiņi transportēšanai" },
                        { id: "hasTehniskaPalidziba", label: "Tehniskā palīdzība", desc: "Sniegta tehniskā palīdzība uz vietas" },
                        { id: "hasDarbsNakti", label: "Darbs naktī", desc: "Izsaukums nakts laikā (22:00 - 06:00)" }
                      ].map((item) => (
                        <div key={item.id} className="space-y-2">
                          <FormField
                            control={form.control}
                            name={item.id as any}
                            render={({ field }) => (
                              <div className={cn(
                                "flex items-center space-x-3 rounded-xl p-4 transition-colors cursor-pointer border",
                                field.value ? "bg-orange-100/50 border-orange-200" : "bg-orange-50/30 border-orange-50/50"
                              )}>
                                <Checkbox
                                  id={item.id}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="rounded-full border-orange-400 data-[state=checked]:bg-orange-500"
                                />
                                <div className="space-y-0.5">
                                  <Label htmlFor={item.id} className="text-slate-800 font-bold cursor-pointer">{item.label}</Label>
                                  <p className="text-xs text-slate-500">{item.desc}</p>
                                </div>
                              </div>
                            )}
                          />
                          {item.id === "hasRati" && hasRati && (
                            <div className="pl-6 pt-2">
                              <FormField
                                control={form.control}
                                name="ratiType"
                                render={({ field }) => (
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex gap-4"
                                  >
                                    {["1", "2", "3", "4"].map((val) => (
                                      <div key={val} className="flex items-center space-x-2">
                                        <RadioGroupItem value={val} id={`rati-${val}`} className="border-orange-400 text-orange-500" />
                                        <Label htmlFor={`rati-${val}`} className="text-slate-600 font-bold">{val}</Label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Piezīmes par reisu</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Papildus informācija..." className="rounded-xl border-slate-100 bg-slate-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {activeTab === "Papildus" && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="extraCosts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold">Papildus izdevumi (€)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="extraCostsDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold">Apraksts</FormLabel>
                          <FormControl>
                            <Input placeholder="piem. Nakts tarifs" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-600 font-semibold">Pielikumi (max 5 faili, 5MB katrs)</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4 bg-slate-50/30 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="bg-white w-12 h-12 rounded-xl shadow-sm flex items-center justify-center mx-auto">
                        <Upload className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Noklikšķiniet vai velciet failus</p>
                        <p className="text-xs text-slate-400">Attēli vai PDF</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Norēķins" && (
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-slate-600 font-semibold">Norēķina veids</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            {["Skaidrā nauda", "Rēķins"].map((val) => (
                              <div
                                key={val}
                                className={cn(
                                  "flex items-center space-x-3 rounded-xl p-4 transition-colors cursor-pointer border",
                                  field.value === val ? "bg-orange-100/50 border-orange-200" : "bg-orange-50/30 border-orange-50/50"
                                )}
                              >
                                <RadioGroupItem value={val} id={val} className="border-orange-400 text-orange-500" />
                                <Label htmlFor={val} className="text-slate-800 font-bold cursor-pointer">{val}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentType === "Skaidrā nauda" && (
                    <FormField
                      control={form.control}
                      name="cashAmount"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-4">
                          <FormLabel className="text-slate-600 font-semibold">Skaidras naudas summa (€)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} className="rounded-xl border-slate-100 bg-slate-50/50 h-14 text-lg font-bold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="paymentNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Piezīmes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Papildus informācija..." className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-2xl border border-slate-100 p-6 space-y-4 bg-slate-50/30">
                    <div className="flex items-center gap-2 text-orange-500 font-bold">
                      <Truck className="h-5 w-5" />
                      <h3>Kopsavilkums</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Klients:</span>
                        <span className="text-slate-800 font-bold">{displayClientName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Attālums:</span>
                        <span className="text-slate-800 font-bold">{totalDistance} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 pt-6 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  className="flex-1 rounded-xl h-14 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  disabled={saveMutation.isPending}
                >
                  <Save className="mr-2 h-5 w-5" />
                  Saglabāt melnrakstu
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl h-14 bg-orange-500 hover:bg-orange-600 border-none text-white font-bold shadow-lg shadow-orange-200"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-5 w-5" />
                  )}
                  {trip ? "Saglabāt izmaiņas" : "Iesniegt"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
