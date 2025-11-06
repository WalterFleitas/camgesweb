import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Upload, Download } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type TableType = "victims" | "judges" | "psychologists" | "sessions" | "sessions_completo";

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [tableType, setTableType] = useState<TableType>("victims");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      victims: [{ full_name: "Ejemplo Víctima" }],
      judges: [{ full_name: "Ejemplo Juez" }],
      psychologists: [{ full_name: "Ejemplo Psicólogo" }],
      sessions: [
        {
          disco_number: 12345,
          session_date: "2024-01-01",
          case_name: "Caso Ejemplo",
          defendant_name: "Acusado Ejemplo",
          victim_id: 1,
          judge_id: 1,
          psychologist_id: 1,
        },
      ],
      sessions_completo: [
        {
          "Disco Nº": 1,
          "Fecha": "9/4/2018",
          "Oficio N°": "190/2018",
          "Juzgado o Fiscalí": "Juzgado Penal de Garantías de Katuete Abg. Alcira De Souza Lima",
          "Causa": "M.P.C/Roque Caballero Quiñonez S/ SP.H.P.C/ niños y adolescentes (abuso sexual en niños)",
          "Psicóloga": "",
          "Cant. Cop.": 1,
          "Nombre/Apellido - Firma": "Si",
        },
      ],
    };

    const ws = XLSX.utils.json_to_sheet(templates[tableType]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tableType);
    XLSX.writeFile(wb, `plantilla_${tableType}.xlsx`);

    toast({
      title: "Plantilla descargada",
      description: "Usa esta plantilla para importar tus registros",
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("El archivo está vacío");
      }

      if (tableType === "sessions_completo") {
        // Procesar el formato completo del Excel del usuario
        for (const row of jsonData) {
          const rowData: any = row;
          
          // Convertir fecha (formato d/m/yyyy)
          let sessionDate = new Date();
          if (rowData["Fecha"]) {
            const fechaParts = rowData["Fecha"].toString().split("/");
            if (fechaParts.length === 3) {
              const [day, month, year] = fechaParts;
              sessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }

          // Buscar o crear juez
          let judgeId = null;
          if (rowData["Juzgado o Fiscalí"]) {
            const judgeName = rowData["Juzgado o Fiscalí"].toString().trim();
            const { data: existingJudge } = await supabase
              .from("judges")
              .select("id")
              .ilike("full_name", judgeName)
              .eq("user_id", user.id)
              .maybeSingle();

            if (existingJudge) {
              judgeId = existingJudge.id;
            } else {
              const { data: newJudge, error: judgeError } = await supabase
                .from("judges")
                .insert({ full_name: judgeName, user_id: user.id })
                .select("id")
                .single();
              
              if (!judgeError && newJudge) {
                judgeId = newJudge.id;
              }
            }
          }

          // Buscar o crear psicólogo
          let psychologistId = null;
          if (rowData["Psicóloga"] && rowData["Psicóloga"].toString().trim()) {
            const psychologistName = rowData["Psicóloga"].toString().trim();
            const { data: existingPsych } = await supabase
              .from("psychologists")
              .select("id")
              .ilike("full_name", psychologistName)
              .eq("user_id", user.id)
              .maybeSingle();

            if (existingPsych) {
              psychologistId = existingPsych.id;
            } else {
              const { data: newPsych, error: psychError } = await supabase
                .from("psychologists")
                .insert({ full_name: psychologistName, user_id: user.id })
                .select("id")
                .single();
              
              if (!psychError && newPsych) {
                psychologistId = newPsych.id;
              }
            }
          }

          // Buscar o crear víctima
          let victimId = null;
          if (rowData["Nombre/Apellido - Firma"] && rowData["Nombre/Apellido - Firma"].toString().trim() !== "Si") {
            const victimName = rowData["Nombre/Apellido - Firma"].toString().trim();
            const { data: existingVictim } = await supabase
              .from("victims")
              .select("id")
              .ilike("full_name", victimName)
              .eq("user_id", user.id)
              .maybeSingle();

            if (existingVictim) {
              victimId = existingVictim.id;
            } else {
              const { data: newVictim, error: victimError } = await supabase
                .from("victims")
                .insert({ full_name: victimName, user_id: user.id })
                .select("id")
                .single();
              
              if (!victimError && newVictim) {
                victimId = newVictim.id;
              }
            }
          }

          // Insertar sesión
          const sessionData = {
            user_id: user.id,
            disco_number: parseInt(rowData["Disco Nº"]) || 0,
            session_date: sessionDate.toISOString(),
            oficio_number: rowData["Oficio N°"]?.toString() || null,
            case_name: rowData["Causa"]?.toString() || "Sin especificar",
            defendant_name: "N/A",
            cantidad_copias: parseInt(rowData["Cant. Cop."]) || null,
            judge_id: judgeId,
            psychologist_id: psychologistId,
            victim_id: victimId,
          };

          const { error: sessionError } = await supabase
            .from("sessions")
            .insert(sessionData);

          if (sessionError) {
            console.error("Error inserting session:", sessionError);
            throw sessionError;
          }
        }

        toast({
          title: "Importación exitosa",
          description: `Se importaron ${jsonData.length} registros`,
        });
      } else {
        // Preparar datos con user_id (formato original)
        const dataWithUserId = jsonData.map((row: any) => ({
          ...row,
          user_id: user.id,
          // Convertir fecha para sessions si es necesario
          ...(tableType === "sessions" && row.session_date
            ? { session_date: new Date(row.session_date).toISOString() }
            : {}),
        }));

        // Insertar en la tabla correspondiente
        const { error } = await supabase.from(tableType).insert(dataWithUserId);

        if (error) throw error;

        toast({
          title: "Importación exitosa",
          description: `Se importaron ${jsonData.length} registros`,
        });
      }

      onSuccess();
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      console.error("Error importing:", error);
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar desde Excel</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de registro y carga tu archivo Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Registro</Label>
            <Select value={tableType} onValueChange={(value) => setTableType(value as TableType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="victims">Víctimas</SelectItem>
                <SelectItem value="judges">Jueces</SelectItem>
                <SelectItem value="psychologists">Psicólogos</SelectItem>
                <SelectItem value="sessions">Sesiones (Simple)</SelectItem>
                <SelectItem value="sessions_completo">Sesiones (Formato Completo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Archivo Excel</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isLoading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Importando..." : "Importar"}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Descarga la plantilla correspondiente</li>
              <li>Completa los datos en el archivo Excel</li>
              <li>Guarda el archivo y súbelo aquí</li>
              <li>Haz clic en "Importar"</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
