import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SessionWithRelations {
  id: number;
  session_date: string;
  case_name: string;
  defendant_name: string;
  disco_number: number;
  victim_id: number | null;
  judge_id: number | null;
  psychologist_id: number | null;
  victims: { full_name: string } | null;
  judges: { full_name: string } | null;
  psychologists: { full_name: string } | null;
}

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data: sessions } = useQuery({
    queryKey: ["report-sessions", format(selectedMonth, "yyyy-MM")],
    queryFn: async () => {
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("sessions")
        .select("*, victims(*), judges(*), psychologists(*)")
        .gte("session_date", startDate)
        .lte("session_date", endDate)
        .order("session_date", { ascending: true });

      if (error) throw error;
      return (data || []) as SessionWithRelations[];
    },
  });

  const totalSessions = sessions?.length || 0;
  const uniqueVictims = new Set(sessions?.map(s => s.victim_id).filter(Boolean)).size;
  const uniqueJudges = new Set(sessions?.map(s => s.judge_id).filter(Boolean)).size;
  const uniquePsychologists = new Set(sessions?.map(s => s.psychologist_id).filter(Boolean)).size;

  // Weekly breakdown
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  const weeklyData = weeks.map((weekStart, index) => {
    const wStart = weekStart < monthStart ? monthStart : weekStart;
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const wEndClamped = wEnd > monthEnd ? monthEnd : wEnd;
    const weekSessions = sessions?.filter(s => {
      const d = new Date(s.session_date);
      return isWithinInterval(d, { start: wStart, end: wEndClamped });
    }) || [];
    return {
      label: `Semana ${index + 1} (${format(wStart, "dd/MM")} - ${format(wEndClamped, "dd/MM")})`,
      count: weekSessions.length,
      sessions: weekSessions,
    };
  });

  // Psychologist summary
  const psychologistMap = new Map<string, number>();
  sessions?.forEach(s => {
    const name = s.psychologists?.full_name || "Sin asignar";
    psychologistMap.set(name, (psychologistMap.get(name) || 0) + 1);
  });
  const psychologistSummary = Array.from(psychologistMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthLabel = format(selectedMonth, "MMMM 'de' yyyy", { locale: es });
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    // Title
    doc.setFontSize(18);
    doc.text("Informe de Cámara Gesell", 14, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${capitalize(monthLabel)}`, 14, 28);
    doc.setFontSize(10);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 34);

    // General stats
    doc.setFontSize(14);
    doc.text("Resumen General", 14, 46);
    autoTable(doc, {
      startY: 50,
      head: [["Indicador", "Cantidad"]],
      body: [
        ["Total de sesiones en el mes", String(totalSessions)],
        ["Víctimas atendidas", String(uniqueVictims)],
        ["Jueces participantes", String(uniqueJudges)],
        ["Psicólogos participantes", String(uniquePsychologists)],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Weekly breakdown
    const afterFirstTable = (doc as any).lastAutoTable?.finalY || 80;
    doc.setFontSize(14);
    doc.text("Desglose por Semana", 14, afterFirstTable + 12);
    autoTable(doc, {
      startY: afterFirstTable + 16,
      head: [["Semana", "Cantidad de Sesiones"]],
      body: weeklyData.map(w => [w.label, String(w.count)]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Psychologists
    const afterSecondTable = (doc as any).lastAutoTable?.finalY || 140;
    doc.setFontSize(14);
    doc.text("Psicólogos que realizaron Cámara", 14, afterSecondTable + 12);
    autoTable(doc, {
      startY: afterSecondTable + 16,
      head: [["Psicólogo", "Cantidad de Sesiones"]],
      body: psychologistSummary.map(([name, count]) => [name, String(count)]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Session detail
    const afterThirdTable = (doc as any).lastAutoTable?.finalY || 200;
    if (afterThirdTable > 240) doc.addPage();
    const detailStartY = afterThirdTable > 240 ? 20 : afterThirdTable + 12;
    doc.setFontSize(14);
    doc.text("Detalle de Sesiones", 14, detailStartY);
    autoTable(doc, {
      startY: detailStartY + 4,
      head: [["Fecha", "Causa", "Imputado", "Víctima", "Psicólogo", "Disco"]],
      body: (sessions || []).map(s => [
        format(new Date(s.session_date), "dd/MM/yyyy HH:mm"),
        s.case_name,
        s.defendant_name,
        s.victims?.full_name || "-",
        s.psychologists?.full_name || "-",
        String(s.disco_number),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    doc.save(`Informe_Gesell_${format(selectedMonth, "yyyy-MM")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Informes y Reportes</h1>
          <p className="text-muted-foreground">Estadísticas y exportación de sesiones registradas</p>
        </div>
        <Button onClick={generatePDF} disabled={!sessions}>
          <FileText className="h-4 w-4 mr-2" />
          Generar PDF
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">en el mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Víctimas Atendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{uniqueVictims}</div>
            <p className="text-xs text-muted-foreground mt-1">víctimas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Jueces Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{uniqueJudges}</div>
            <p className="text-xs text-muted-foreground mt-1">jueces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Psicólogos Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{uniquePsychologists}</div>
            <p className="text-xs text-muted-foreground mt-1">psicólogos</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{w.label}</span>
                <span className="text-lg font-bold">{w.count} sesiones</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Psychologist summary */}
      <Card>
        <CardHeader>
          <CardTitle>Psicólogos que realizaron Cámara</CardTitle>
        </CardHeader>
        <CardContent>
          {psychologistSummary.length > 0 ? (
            <div className="space-y-3">
              {psychologistSummary.map(([name, count], i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-lg font-bold">{count} sesiones</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No hay datos para este período</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
