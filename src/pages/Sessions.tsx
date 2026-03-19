import { useState } from "react";
import { Plus, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionDialog } from "@/components/SessionDialog";
import { SessionsTable } from "@/components/SessionsTable";
import { ImportDialog } from "@/components/ImportDialog";
import { useUserRole } from "@/hooks/useUserRole";

const Sessions = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { isAdmin } = useUserRole();
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          victims(id, full_name),
          judges(id, full_name),
          psychologists(id, full_name),
          courts(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Sesiones de Cámara Gesell</h1>
          <p className="text-muted-foreground">Gestión de sesiones y causas judiciales</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sesión
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando sesiones...</div>
          ) : sessions && sessions.length > 0 ? (
            <SessionsTable sessions={sessions} onUpdate={refetch} isAdmin={isAdmin} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No hay sesiones registradas. Haz clic en "Nueva Sesión" para comenzar.
            </div>
          )}
        </CardContent>
      </Card>

      <SessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={refetch}
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Sessions;