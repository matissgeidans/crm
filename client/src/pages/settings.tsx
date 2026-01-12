import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, User, Shield, Palette, Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  firstName: z.string().min(1, "Vārds ir obligāts"),
  lastName: z.string().min(1, "Uzvārds ir obligāts"),
  vehicleName: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      vehicleName: user?.vehicleName || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileValues) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profils atjaunināts",
        description: "Jūsu izmaiņas ir saglabātas.",
      });
    },
    onError: () => {
      toast({
        title: "Kļūda",
        description: "Neizdevās atjaunināt profilu.",
        variant: "destructive",
      });
    },
  });

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return "Lietotājs";
  };

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-800">Iestatījumi</h1>
        <p className="text-slate-500 font-medium">
          Pārvaldiet savu profilu un sistēmas vēlmes
        </p>
      </div>

      <div className="grid gap-8 max-w-4xl">
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-100">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-800">Mans profils</CardTitle>
                <CardDescription className="font-medium">Jūsu personīgā informācija</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-orange-50 shadow-sm">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-orange-500 text-white text-xl font-black">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {getUserDisplayName()}
                </h3>
                <p className="text-slate-400 font-bold text-sm">
                  {user?.email}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold">Vārds</FormLabel>
                        <FormControl>
                          <Input placeholder="Vārds" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold">Uzvārds</FormLabel>
                        <FormControl>
                          <Input placeholder="Uzvārds" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="vehicleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-bold">Auto nosaukums / Modelis</FormLabel>
                      <FormControl>
                        <Input placeholder="piem. SCANIA R450" {...field} className="rounded-xl border-slate-100 bg-slate-50/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="rounded-xl h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-100 border-none"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Saglabāt izmaiņas
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-100">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-800">Loma & Atļaujas</CardTitle>
                <CardDescription className="font-medium">Jūsu piekļuves līmenis sistēmā</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <Badge className={cn(
                "rounded-full px-4 py-1.5 font-black uppercase tracking-widest text-[10px]",
                isAdmin ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"
              )}>
                {isAdmin ? "Administrators" : "Vadītājs"}
              </Badge>
              <p className="text-sm text-slate-500 font-medium">
                {isAdmin
                  ? "Pilna piekļuve visām atskaitēm, klientiem un sistēmas iestatījumiem"
                  : "Piekļuve personīgajām braucienu atskaitēm un vadības panelim"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-100">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-800">Izskats</CardTitle>
                <CardDescription className="font-medium">Pielāgojiet sistēmas vizuālo tēmu</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800">Vizuālā tēma</p>
                <p className="text-sm text-slate-500 font-medium">
                  Pārslēdzieties starp gaišo un tumšo režīmu
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <div className="pt-4 pb-8 flex justify-center">
          <Button variant="ghost" asChild className="rounded-xl text-slate-400 font-bold hover:text-red-500 hover:bg-red-50">
            <a href="/api/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Izrakstīties no sistēmas
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
