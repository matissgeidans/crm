import { useLocation } from "wouter";
import { TripForm } from "@/components/trip-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewTripPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back-new-trip"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Log New Trip</h1>
          <p className="text-muted-foreground">
            Enter the details of your towing trip
          </p>
        </div>
      </div>

      <TripForm onSuccess={() => setLocation("/")} />
    </div>
  );
}
