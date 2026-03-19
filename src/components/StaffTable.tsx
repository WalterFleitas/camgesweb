import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { StaffDialog } from "@/components/StaffDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StaffTableProps {
  staff: any[];
  type: "judges" | "psychologists" | "courts";
  onUpdate: () => void;
}

export function StaffTable({ staff, type, onUpdate }: StaffTableProps) {
  const { toast } = useToast();
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingStaffId) return;

    try {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq("id", deletingStaffId);

      if (error) throw error;

      const label = type === "judges" ? "Juez/a" : "Psicólogo/a";
      toast({
        title: `${label} eliminado`,
        description: `El/la ${label.toLowerCase()} se eliminó correctamente`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingStaffId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.id}</TableCell>
                <TableCell>{member.full_name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingStaff(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingStaffId(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StaffDialog
        open={!!editingStaff}
        onOpenChange={(open) => !open && setEditingStaff(null)}
        onSuccess={onUpdate}
        type={type}
        staff={editingStaff}
      />

      <AlertDialog open={!!deletingStaffId} onOpenChange={(open) => !open && setDeletingStaffId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}