import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { ALL_MODULES, type ModuleKey } from "@/hooks/useModulePermissions";
import { Shield, Users } from "lucide-react";

const UserManagement = () => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const { data: modulePermissions } = useQuery({
    queryKey: ["all-module-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("user_id, module");
      if (error) throw error;
      return data;
    },
  });

  const getRoleForUser = (userId: string) => {
    const userRole = roles?.find((r) => r.user_id === userId);
    return userRole?.role ?? "user";
  };

  const getUserModules = (userId: string): ModuleKey[] => {
    return (modulePermissions?.filter((p) => p.user_id === userId).map((p) => p.module) ?? []) as ModuleKey[];
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    try {
      const existing = roles?.find((r) => r.user_id === userId);

      if (newRole === "user" && existing) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;
      } else if (newRole === "admin") {
        if (existing) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: newRole })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: newRole });
          if (error) throw error;
        }
      }

      toast({
        title: "Rol actualizado",
        description: `El rol se ha cambiado a ${newRole === "admin" ? "Administrador" : "Usuario"}`,
      });

      queryClient.invalidateQueries({ queryKey: ["all-roles"] });
    } catch (error: any) {
      toast({
        title: "Error al cambiar rol",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleModuleToggle = async (userId: string, moduleKey: ModuleKey, enabled: boolean) => {
    try {
      if (enabled) {
        const { error } = await supabase
          .from("user_module_permissions")
          .insert({ user_id: userId, module: moduleKey });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_module_permissions")
          .delete()
          .eq("user_id", userId)
          .eq("module", moduleKey);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["all-module-permissions"] });
      toast({ title: "Permisos actualizados" });
    } catch (error: any) {
      toast({
        title: "Error al actualizar permisos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleAll = async (userId: string, userModules: ModuleKey[]) => {
    const allEnabled = ALL_MODULES.every((m) => userModules.includes(m.key));
    try {
      if (allEnabled) {
        // Remove all
        const { error } = await supabase
          .from("user_module_permissions")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Add missing ones
        const missing = ALL_MODULES.filter((m) => !userModules.includes(m.key));
        const inserts = missing.map((m) => ({ user_id: userId, module: m.key }));
        const { error } = await supabase
          .from("user_module_permissions")
          .insert(inserts);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["all-module-permissions"] });
      toast({ title: "Permisos actualizados" });
    } catch (error: any) {
      toast({
        title: "Error al actualizar permisos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Gestión de Usuarios
        </h1>
        <p className="text-muted-foreground">Asignar roles y permisos de módulos a los usuarios registrados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Registrados
          </CardTitle>
          <CardDescription>
            Los administradores tienen acceso completo. Los usuarios solo ven los módulos habilitados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : profiles && profiles.length > 0 ? (
            <div className="space-y-6">
              {profiles.map((profile) => {
                const currentRole = getRoleForUser(profile.id);
                const userModules = getUserModules(profile.id);
                const isUserAdmin = currentRole === "admin";

                return (
                  <Card key={profile.id} className="border">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="font-semibold text-lg">{profile.full_name || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">
                            Registrado: {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={isUserAdmin ? "default" : "secondary"}>
                            {isUserAdmin ? "Administrador" : "Usuario"}
                          </Badge>
                          <Select
                            value={currentRole}
                            onValueChange={(value) => handleRoleChange(profile.id, value as "admin" | "user")}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {!isUserAdmin && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Módulos habilitados:</p>
                            <button
                              onClick={() => handleToggleAll(profile.id, userModules)}
                              className="text-xs text-primary hover:underline"
                            >
                              {ALL_MODULES.every((m) => userModules.includes(m.key))
                                ? "Desmarcar todos"
                                : "Marcar todos"}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {ALL_MODULES.map((mod) => (
                              <label
                                key={mod.key}
                                className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  checked={userModules.includes(mod.key)}
                                  onCheckedChange={(checked) =>
                                    handleModuleToggle(profile.id, mod.key, !!checked)
                                  }
                                />
                                <span className="text-sm">{mod.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No hay usuarios registrados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
