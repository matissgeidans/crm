import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", { username, password });
      const user = await res.json();
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Sveicināti!",
        description: `Esat veiksmīgi pieslēdzies kā ${user.firstName}`,
      });
    } catch (error: any) {
      toast({
        title: "Kļūda",
        description: "Nepareizs lietotājvārds vai parole",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Lietotājvārds</Label>
              <Input
                id="username"
                placeholder="Lietotājvārds"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parole</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
            </div>
            <Button 
              type="submit"
              size="lg" 
              className="w-full h-14 text-lg font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] rounded-2xl shadow-lg transition-all active:scale-[0.98] border-none"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Pieslēgties"}
            </Button>
          </form>
          
          <div className="mt-8 p-4 bg-muted rounded-2xl text-xs space-y-2">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider">Demo piekļuve:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Vadītājs:</p>
                <p>vaditajs / 123</p>
              </div>
              <div>
                <p className="text-muted-foreground">Admin:</p>
                <p>admin / 123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground/60">
        &copy; {new Date().getFullYear()} TowTrack CRM
      </div>
    </div>
  );
}
