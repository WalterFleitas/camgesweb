import { Video, Search, FileText, Users, Briefcase, FileSpreadsheet, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import logoPoderJudicialFull from "@/assets/logo-poder-judicial-full.png";

const menuItems = [
  { title: "Sesiones de Cámara Gesell", url: "/", icon: Video },
  { title: "Búsqueda de Sesiones", url: "/search", icon: Search },
  { title: "Informes y Reportes", url: "/reports", icon: FileText },
  { title: "Gestión de Víctimas", url: "/victims", icon: Users },
  { title: "Gestión de Personal", url: "/staff", icon: Briefcase },
  { title: "Oficios y Documentos", url: "/documents", icon: FileSpreadsheet },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-6 border-b">
          <img src={logoPoderJudicialFull} alt="Poder Judicial" className="h-24 w-full object-contain" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}