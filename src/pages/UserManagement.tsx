import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
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

  const getRoleForUser = (userId: string) => {
    const userRole = roles?.find((r) => r.user_id === userId);
    return userRole?.role ?? "user";
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
        <p className="text-muted-foreground">Asignar roles y permisos a los usuarios registrados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Registrados
          </CardTitle>
          <CardDescription>
            Los administradores pueden crear, editar y eliminar registros. Los usuarios solo pueden ver la información.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : profiles && profiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Cambiar Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const currentRole = getRoleForUser(profile.id);
                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.full_name || "Sin nombre"}
                      </TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={currentRole === "admin" ? "default" : "secondary"}>
                          {currentRole === "admin" ? "Administrador" : "Usuario"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
