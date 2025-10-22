import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

const Documents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Oficios y Documentos</h1>
        <p className="text-muted-foreground">Gestión de oficios y documentos judiciales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Módulo de documentos en desarrollo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;