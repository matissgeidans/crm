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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Send } from "lucide-react";
import type { Client, Trip } from "@shared/schema";

const tripFormSchema = z.object({
  clientId: z.string().optional(),
  vehicleMake: z.string().min(1, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleColor: z.string().optional(),
  vehicleDescription: z.string().optional(),
  licensePlate: z.string().min(1, "License plate is required").max(20),
  distanceKm: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Distance must be a positive number",
  }),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  tripDate: z.string(),
  notes: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

interface TripFormProps {
  trip?: Trip;
  onSuccess?: () => void;
}

export function TripForm({ trip, onSuccess }: TripFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const activeClients = clients.filter((c) => c.status === "active");

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      clientId: trip?.clientId?.toString() || "",
      vehicleMake: trip?.vehicleMake || "",
      vehicleModel: trip?.vehicleModel || "",
      vehicleColor: trip?.vehicleColor || "",
      vehicleDescription: trip?.vehicleDescription || "",
      licensePlate: trip?.licensePlate || "",
      distanceKm: trip?.distanceKm?.toString() || "",
      pickupLocation: trip?.pickupLocation || "",
      dropoffLocation: trip?.dropoffLocation || "",
      tripDate: trip?.tripDate
        ? new Date(trip.tripDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      notes: trip?.notes || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TripFormValues & { status: string }) => {
      const payload = {
        ...data,
        clientId: data.clientId ? parseInt(data.clientId) : null,
        distanceKm: data.distanceKm,
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
        title: variables.status === "submitted" ? "Trip Submitted" : "Draft Saved",
        description: variables.status === "submitted" 
          ? "Your trip report has been submitted for review." 
          : "Your trip has been saved as a draft.",
      });
      onSuccess?.();
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
        description: "Failed to save trip. Please try again.",
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

  const selectedClient = activeClients.find(
    (c) => c.id.toString() === form.watch("clientId")
  );
  const estimatedCost =
    selectedClient && form.watch("distanceKm")
      ? (Number(form.watch("distanceKm")) * Number(selectedClient.ratePerKm)).toFixed(2)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{trip ? "Edit Trip" : "Log New Trip"}</CardTitle>
        <CardDescription>
          Enter the details of your towing trip. Required fields are marked with *.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={clientsLoading}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeClients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}
                            data-testid={`client-option-${client.id}`}
                          >
                            {client.name} (${client.ratePerKm}/km)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the client for rate calculation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tripDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Date & Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        data-testid="input-trip-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Vehicle Information</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="vehicleMake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Toyota"
                          {...field}
                          data-testid="input-vehicle-make"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Camry"
                          {...field}
                          data-testid="input-vehicle-model"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Silver"
                          {...field}
                          data-testid="input-vehicle-color"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., ABC-1234"
                          {...field}
                          className="uppercase"
                          data-testid="input-license-plate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distanceKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (km) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="0.0"
                          {...field}
                          data-testid="input-distance"
                        />
                      </FormControl>
                      {estimatedCost && (
                        <FormDescription>
                          Estimated cost: ${estimatedCost}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vehicleDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about the vehicle..."
                        className="resize-none"
                        {...field}
                        data-testid="input-vehicle-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Location Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Address or description"
                          {...field}
                          data-testid="input-pickup-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drop-off Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Address or description"
                          {...field}
                          data-testid="input-dropoff-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about the trip..."
                      className="resize-none"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={saveMutation.isPending}
                data-testid="button-save-draft"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="button-submit-trip"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Trip
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
