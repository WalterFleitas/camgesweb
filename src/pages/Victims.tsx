import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VictimDialog } from "@/components/VictimDialog";
import { VictimsTable } from "@/components/VictimsTable";

const Victims = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Víctima
        </Button>
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
    </div>
  );
};

export default Victims;