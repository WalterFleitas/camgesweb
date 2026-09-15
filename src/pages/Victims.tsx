import { useState } from "react";
import { Plus, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VictimDialog } from "@/components/VictimDialog";
import { VictimsTable } from "@/components/VictimsTable";
import { ImportDialog } from "@/components/ImportDialog";
import { useUserRole } from "@/hooks/useUserRole";

const Victims = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { isAdmin } = useUserRole();

  const { data: victims, isLoading, refetch } = useQuery({
    queryKey: ["victims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("victims")
        .select("*")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Víctimas</h1>
          <p className="text-muted-foreground">Mantenimiento de registros de víctimas</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Víctima
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Víctimas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando víctimas...</div>
          ) : victims && victims.length > 0 ? (
            <VictimsTable victims={victims} onUpdate={refetch} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No hay víctimas registradas.
            </div>
          )}
        </CardContent>
      </Card>

      <VictimDialog
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

export default Victims;