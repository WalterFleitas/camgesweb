import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export const ALL_MODULES = [
  { key: "sessions", label: "Sesiones de Cámara Gesell", path: "/" },
  { key: "search", label: "Búsqueda de Sesiones", path: "/search" },
  { key: "reports", label: "Informes y Reportes", path: "/reports" },
  { key: "victims", label: "Gestión de Víctimas", path: "/victims" },
  { key: "staff", label: "Gestión de Personal", path: "/staff" },
  { key: "documents", label: "Oficios y Documentos", path: "/documents" },
] as const;

export type ModuleKey = (typeof ALL_MODULES)[number]["key"];

export function useModulePermissions() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [allowedModules, setAllowedModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;

    if (isAdmin) {
      setAllowedModules(ALL_MODULES.map((m) => m.key));
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAllowedModules([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_module_permissions")
        .select("module")
        .eq("user_id", user.id);

      setAllowedModules((data?.map((d) => d.module) ?? []) as ModuleKey[]);
      setLoading(false);
    };

    fetchPermissions();
  }, [isAdmin, roleLoading]);

  const hasAccess = (moduleKey: ModuleKey) => isAdmin || allowedModules.includes(moduleKey);

  return { allowedModules, hasAccess, loading: loading || roleLoading };
}
