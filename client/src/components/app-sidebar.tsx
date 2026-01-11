import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Truck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, isAdmin } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Panelis",
      url: "/",
      icon: LayoutDashboard,
      roles: ["driver", "admin"],
    },
    {
      title: "Ziņojumi",
      url: "/trips",
      icon: FileText,
      roles: ["driver", "admin"],
    },
    {
      title: "Klients",
      url: "/clients",
      icon: Users,
      roles: ["admin"],
    },
    {
      title: "Analītika",
      url: "/analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      title: "Iestatījumi",
      url: "/settings",
      icon: Settings,
      roles: ["driver", "admin"],
    },
  ];

  const filteredItems = menuItems.filter((item) => 
    item.roles.includes(user?.role || "driver")
  );

  return (
    <Sidebar className="border-r border-slate-100 bg-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-100">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Evakuatori</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CRM Sistēma</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-8">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="rounded-2xl h-12 px-4 transition-all hover:bg-slate-50 data-[active=true]:bg-orange-500 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-orange-100 group"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-bold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-slate-50 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-2xl shadow-sm border-2 border-slate-50">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-orange-100 text-orange-600 font-black">
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-slate-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {user?.role === "admin" ? "Administrators" : "Vadītājs"}
            </p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          asChild 
          className="w-full justify-start h-12 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold px-4"
        >
          <a href="/api/logout" className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            Iziet no sistēmas
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
