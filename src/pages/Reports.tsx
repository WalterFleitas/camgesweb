import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: stats } = useQuery({
    queryKey: ["stats", format(selectedMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);

      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*, victims(*), judges(*), psychologists(*)")
        .gte("session_date", start.toISOString())
        .lte("session_date", end.toISOString());

      if (sessionsError) throw sessionsError;

      const totalSessions = sessions?.length || 0;
      const uniqueVictims = new Set(sessions?.map(s => s.victim_id).filter(Boolean)).size;
      const uniqueJudges = new Set(sessions?.map(s => s.judge_id).filter(Boolean)).size;
      const uniquePsychologists = new Set(sessions?.map(s => s.psychologist_id).filter(Boolean)).size;

      return {
        totalSessions,
        uniqueVictims,
        uniqueJudges,
        uniquePsychologists,
      };
    },
  });

  const handleExport = () => {
    // Placeholder for export functionality
    alert("Funcionalidad de exportación en desarrollo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Informes y Reportes</h1>
          <p className="text-muted-foreground">Estadísticas y exportación de sesiones registradas</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar a Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Período de Consulta</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium">Seleccionar Mes</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedMonth(newDate);
                }}
              >
                ←
              </Button>
              <div className="px-4 py-2 border rounded-md min-w-[180px] text-center">
                {format(selectedMonth, "MMMM 'de' yyyy", { locale: es })}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedMonth(newDate);
                }}
              >
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">sesiones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Víctimas Atendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.uniqueVictims || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">víctimas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jueces Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.uniqueJudges || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">jueces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Psicólogos Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.uniquePsychologists || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">psicólogos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;