import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Truck, ClipboardList, BarChart3, Users, Shield, FileSpreadsheet } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: ClipboardList,
      title: "Trip Reporting",
      description: "Log daily towing trips with vehicle details, distance, and automatic cost calculation.",
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Manage clients with custom per-km rates and track their service history.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "View real-time metrics, revenue estimates, and driver performance insights.",
    },
    {
      icon: FileSpreadsheet,
      title: "Report Export",
      description: "Generate professional PDF and Excel reports with detailed trip summaries.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure access control with separate views for drivers and administrators.",
    },
    {
      icon: Truck,
      title: "Mobile Optimized",
      description: "Designed for drivers in the field with responsive, touch-friendly interfaces.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">TowTrack CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Streamline Your
              <span className="text-primary"> Towing Operations</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              A comprehensive CRM designed for towing services. Track trips, manage clients, 
              and generate reports with ease. Built for drivers in the field and administrators at the desk.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Everything You Need to Manage Your Fleet
              </h2>
              <p className="mt-4 text-muted-foreground">
                Powerful features designed specifically for towing service businesses.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card 
                  key={feature.title} 
                  className="border-border/50"
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to Transform Your Operations?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join towing companies that trust TowTrack CRM to manage their daily operations.
            </p>
            <Button size="lg" className="mt-8" asChild data-testid="button-start-free">
              <a href="/api/login">Start Free Today</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>TowTrack CRM - Professional Towing Services Management</p>
        </div>
      </footer>
    </div>
  );
}
