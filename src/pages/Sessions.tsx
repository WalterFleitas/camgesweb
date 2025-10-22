import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionDialog } from "@/components/SessionDialog";
import { SessionsTable } from "@/components/SessionsTable";

const Sessions = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          victims(id, full_name),
          judges(id, full_name),
          psychologists(id, full_name)
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
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sesión
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando sesiones...</div>
          ) : sessions && sessions.length > 0 ? (
            <SessionsTable sessions={sessions} onUpdate={refetch} />
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
    </div>
  );
};

export default Sessions;