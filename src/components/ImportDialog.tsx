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

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  created: {
    judges?: number;
    psychologists?: number;
    victims?: number;
    sessions?: number;
  };
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [tableType, setTableType] = useState<TableType>("victims");
  const [isLoading, setIsLoading] = useState(false);

  const validateExcelFile = (file: File): boolean => {
    // Validar extensión
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      toast({
        title: "Formato inválido",
        description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
        variant: "destructive",
      });
      return false;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no debe superar los 10MB",
        variant: "destructive",
      });
      return false;
    }

    // Validar que no esté vacío
    if (file.size === 0) {
      toast({
        title: "Archivo vacío",
        description: "El archivo seleccionado está vacío",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateExcelFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        // Limpiar el input si el archivo no es válido
        e.target.value = '';
      }
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

  const validateRow = (row: any, rowIndex: number, type: TableType): string | null => {
    if (type === "sessions_completo") {
      if (!row["Disco Nº"] || isNaN(parseInt(row["Disco Nº"]))) {
        return "Disco Nº inválido o vacío";
      }
      if (!row["Fecha"]) {
        return "Fecha vacía";
      }
      // Validar formato de fecha
      const fechaStr = row["Fecha"]?.toString().trim();
      const fechaParts = fechaStr?.split("/");
      if (!fechaParts || fechaParts.length !== 3) {
        return "Formato de fecha inválido (debe ser d/m/yyyy)";
      }
      if (!row["Causa"] || row["Causa"].toString().trim() === "") {
        return "Causa vacía";
      }
    } else if (type === "sessions") {
      if (!row.disco_number || isNaN(parseInt(row.disco_number))) {
        return "disco_number inválido o vacío";
      }
      if (!row.session_date) {
        return "session_date vacía";
      }
      if (!row.case_name || row.case_name.toString().trim() === "") {
        return "case_name vacía";
      }
      if (!row.defendant_name || row.defendant_name.toString().trim() === "") {
        return "defendant_name vacía";
      }
    } else if (["victims", "judges", "psychologists"].includes(type)) {
      if (!row.full_name || row.full_name.toString().trim() === "") {
        return "full_name vacío";
      }
    }
    return null;
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

      let data: ArrayBuffer;
      let workbook: XLSX.WorkBook;

      try {
        data = await file.arrayBuffer();
        workbook = XLSX.read(data, { type: 'array' });
      } catch (parseError) {
        console.error("Error al leer archivo Excel:", parseError);
        throw new Error(
          "El archivo Excel está corrupto o no se puede leer. " +
          "Por favor verifica que sea un archivo Excel válido (.xlsx o .xls)"
        );
      }
      
      console.log("Hojas disponibles:", workbook.SheetNames);
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error(
          "El archivo Excel no contiene hojas de trabajo visibles. " +
          "Asegúrate de que el archivo tenga al menos una hoja con datos."
        );
      }
      
      // Buscar la primera hoja con datos
      let worksheet = null;
      let sheetRange = null;
      let selectedSheetName = null;

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const range = sheet['!ref'];
        
        if (range) {
          worksheet = sheet;
          sheetRange = range;
          selectedSheetName = sheetName;
          console.log(`Hoja seleccionada: "${sheetName}" con rango: ${range}`);
          break;
        }
      }
      
      if (!worksheet || !sheetRange) {
        throw new Error(
          "No se encontró ninguna hoja con datos en el archivo Excel. " +
          `Hojas disponibles: ${workbook.SheetNames.join(", ")}`
        );
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        blankrows: false,
        raw: false
      });

      console.log("Datos leídos del Excel:", jsonData);
      console.log("Primera fila:", jsonData[0]);
      console.log("Total de filas:", jsonData.length);

      if (jsonData.length === 0) {
        throw new Error(
          "No se encontraron datos en el archivo. " +
          "Verifica que:\n" +
          "1. La primera fila contenga los nombres de las columnas\n" +
          "2. Haya al menos una fila de datos debajo de los encabezados\n" +
          "3. Las celdas no estén completamente vacías"
        );
      }

      // Validar columnas esperadas para sessions_completo
      if (tableType === "sessions_completo") {
        const firstRow: any = jsonData[0];
        const requiredColumns = ["Disco Nº", "Fecha", "Causa"];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          const availableColumns = Object.keys(firstRow).join(", ");
          throw new Error(
            `Faltan columnas requeridas: ${missingColumns.join(", ")}. ` +
            `Columnas encontradas: ${availableColumns || "ninguna"}`
          );
        }
      }

      // Inicializar resultado de importación
      const importResult: ImportResult = {
        success: 0,
        errors: [],
        warnings: [],
        created: {
          judges: 0,
          psychologists: 0,
          victims: 0,
          sessions: 0,
        },
      };

      if (tableType === "sessions_completo") {
        // Procesar el formato completo del Excel del usuario
        for (let i = 0; i < jsonData.length; i++) {
          const rowData: any = jsonData[i];
          const rowNumber = i + 2; // +2 porque Excel empieza en 1 y tiene encabezado

          // Validar fila
          const validationError = validateRow(rowData, rowNumber, tableType);
          if (validationError) {
            importResult.errors.push({
              row: rowNumber,
              message: validationError,
            });
            continue; // Saltar esta fila
          }

          try {
          
            // Convertir fecha (formato d/m/yyyy o d/m/yy)
            let sessionDate = new Date();
            if (rowData["Fecha"]) {
              const fechaStr = rowData["Fecha"].toString().trim();
              const fechaParts = fechaStr.split("/");
              if (fechaParts.length === 3) {
                let [day, month, year] = fechaParts.map(p => parseInt(p));
                
                // Manejar años de 2 dígitos (00-99)
                if (year < 100) {
                  // Si es menor a 50, asumimos 2000s, si no 1900s
                  year = year < 50 ? 2000 + year : 1900 + year;
                }
                
                // Crear fecha a mediodía para evitar problemas de zona horaria
                sessionDate = new Date(year, month - 1, day, 12, 0, 0);
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
                  importResult.created.judges!++;
                }
              }
            } else {
              importResult.warnings.push({
                row: rowNumber,
                message: "Juzgado o Fiscalía vacío",
              });
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
                  importResult.created.psychologists!++;
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
                  importResult.created.victims!++;
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
              importResult.errors.push({
                row: rowNumber,
                message: `Error al insertar: ${sessionError.message}`,
              });
            } else {
              importResult.created.sessions!++;
              importResult.success++;
            }
          } catch (rowError: any) {
            console.error(`Error en fila ${rowNumber}:`, rowError);
            importResult.errors.push({
              row: rowNumber,
              message: rowError.message || "Error desconocido",
            });
          }
        }

        // Mostrar resumen detallado
        const summaryParts = [];
        if (importResult.success > 0) {
          summaryParts.push(`✓ ${importResult.success} sesiones importadas`);
        }
        if (importResult.created.judges! > 0) {
          summaryParts.push(`${importResult.created.judges} jueces creados`);
        }
        if (importResult.created.psychologists! > 0) {
          summaryParts.push(`${importResult.created.psychologists} psicólogos creados`);
        }
        if (importResult.created.victims! > 0) {
          summaryParts.push(`${importResult.created.victims} víctimas creadas`);
        }
        
        let description = summaryParts.join(", ");
        
        if (importResult.errors.length > 0) {
          description += `\n\n⚠ ${importResult.errors.length} filas con errores (ver consola)`;
          console.group("Errores de importación");
          importResult.errors.forEach(err => {
            console.error(`Fila ${err.row}: ${err.message}`);
          });
          console.groupEnd();
        }
        
        if (importResult.warnings.length > 0) {
          description += `\n💡 ${importResult.warnings.length} advertencias (ver consola)`;
          console.group("Advertencias de importación");
          importResult.warnings.forEach(warn => {
            console.warn(`Fila ${warn.row}: ${warn.message}`);
          });
          console.groupEnd();
        }

        toast({
          title: importResult.errors.length > 0 ? "Importación completada con errores" : "Importación exitosa",
          description,
          variant: importResult.errors.length > 0 ? "destructive" : "default",
        });
      } else {
        // Validar y procesar formato original
        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const rowNumber = i + 2;

          const validationError = validateRow(row, rowNumber, tableType);
          if (validationError) {
            importResult.errors.push({
              row: rowNumber,
              message: validationError,
            });
            continue;
          }

          try {
            const rowData = {
              ...row,
              user_id: user.id,
              ...(tableType === "sessions" && row.session_date
                ? { session_date: new Date(row.session_date).toISOString() }
                : {}),
            };

            const { error } = await supabase.from(tableType).insert(rowData);

            if (error) {
              importResult.errors.push({
                row: rowNumber,
                message: `Error al insertar: ${error.message}`,
              });
            } else {
              importResult.success++;
            }
          } catch (rowError: any) {
            importResult.errors.push({
              row: rowNumber,
              message: rowError.message || "Error desconocido",
            });
          }
        }

        // Mostrar resumen
        let description = `✓ ${importResult.success} registros importados`;
        
        if (importResult.errors.length > 0) {
          description += `\n⚠ ${importResult.errors.length} filas con errores (ver consola)`;
          console.group("Errores de importación");
          importResult.errors.forEach(err => {
            console.error(`Fila ${err.row}: ${err.message}`);
          });
          console.groupEnd();
        }

        toast({
          title: importResult.errors.length > 0 ? "Importación completada con errores" : "Importación exitosa",
          description,
          variant: importResult.errors.length > 0 ? "destructive" : "default",
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
