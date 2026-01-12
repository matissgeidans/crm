import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-xl overflow-hidden border-none">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">TowTrack CRM</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Piesakieties, lai turpinātu darbu
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] rounded-2xl shadow-lg transition-all active:scale-[0.98] border-none"
            asChild 
            data-testid="button-login"
          >
            <a href="/api/login">Pieslēgties</a>
          </Button>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nepieciešama palīdzība? Sazinieties ar administratoru.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground/60">
        &copy; {new Date().getFullYear()} TowTrack CRM
      </div>
    </div>
  );
}
