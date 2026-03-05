import { Video, Search, FileText, Users, Briefcase, FileSpreadsheet, LogOut, Shield } from "lucide-react";
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
import { useUserRole } from "@/hooks/useUserRole";
import { useModulePermissions, type ModuleKey } from "@/hooks/useModulePermissions";

const menuItems: { title: string; url: string; icon: any; moduleKey: ModuleKey }[] = [
  { title: "Sesiones de Cámara Gesell", url: "/", icon: Video, moduleKey: "sessions" },
  { title: "Búsqueda de Sesiones", url: "/search", icon: Search, moduleKey: "search" },
  { title: "Informes y Reportes", url: "/reports", icon: FileText, moduleKey: "reports" },
  { title: "Gestión de Víctimas", url: "/victims", icon: Users, moduleKey: "victims" },
  { title: "Gestión de Personal", url: "/staff", icon: Briefcase, moduleKey: "staff" },
  { title: "Oficios y Documentos", url: "/documents", icon: FileSpreadsheet, moduleKey: "documents" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { hasAccess } = useModulePermissions();

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

  const visibleItems = menuItems.filter((item) => hasAccess(item.moduleKey));

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
              {visibleItems.map((item) => (
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
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/users"
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      }
                    >
                      <Shield className="h-4 w-4" />
                      <span>Gestión de Usuarios</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
