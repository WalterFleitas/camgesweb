import { useState } from "react";
import { Plus, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffTable } from "@/components/StaffTable";
import { StaffDialog } from "@/components/StaffDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { useUserRole } from "@/hooks/useUserRole";

const Staff = () => {
  const [activeTab, setActiveTab] = useState("judges");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [staffType, setStaffType] = useState<"judges" | "psychologists" | "courts">("judges");
  const { isAdmin } = useUserRole();

  const { data: judges, refetch: refetchJudges } = useQuery({
    queryKey: ["judges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judges")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: psychologists, refetch: refetchPsychologists } = useQuery({
    queryKey: ["psychologists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psychologists")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: courts, refetch: refetchCourts } = useQuery({
    queryKey: ["courts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const handleNewStaff = (type: "judges" | "psychologists" | "courts") => {
    setStaffType(type);
    setIsDialogOpen(true);
  };

  const refetch = () => {
    refetchJudges();
    refetchPsychologists();
    refetchCourts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
          <p className="text-muted-foreground">Mantenimiento de jueces y psicólogos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="judges">Jueces</TabsTrigger>
                <TabsTrigger value="psychologists">Psicólogos</TabsTrigger>
              </TabsList>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                    <FileUp className="h-4 w-4 mr-2" />
                    Importar Excel
                  </Button>
                  <Button onClick={() => handleNewStaff(activeTab === "judges" ? "judges" : "psychologists")}>
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTab === "judges" ? "Nuevo Juez/a" : "Nuevo Psicólogo/a"}
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab}>
            <TabsContent value="judges">
              <CardTitle className="mb-4">Jueces Registrados</CardTitle>
              {judges && judges.length > 0 ? (
                <StaffTable staff={judges} type="judges" onUpdate={refetch} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No hay jueces registrados.
                </div>
              )}
            </TabsContent>
            <TabsContent value="psychologists">
              <CardTitle className="mb-4">Psicólogos Registrados</CardTitle>
              {psychologists && psychologists.length > 0 ? (
                <StaffTable staff={psychologists} type="psychologists" onUpdate={refetch} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No hay psicólogos registrados.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StaffDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={refetch}
        type={staffType}
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Staff;