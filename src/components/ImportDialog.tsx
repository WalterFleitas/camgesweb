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

type TableType = "victims" | "judges" | "psychologists" | "sessions";

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

      // Preparar datos con user_id
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
                <SelectItem value="sessions">Sesiones</SelectItem>
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
