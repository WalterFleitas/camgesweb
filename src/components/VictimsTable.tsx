import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { VictimDialog } from "@/components/VictimDialog";
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

interface VictimsTableProps {
  victims: any[];
  onUpdate: () => void;
}

export function VictimsTable({ victims, onUpdate }: VictimsTableProps) {
  const { toast } = useToast();
  const [editingVictim, setEditingVictim] = useState<any>(null);
  const [deletingVictimId, setDeletingVictimId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingVictimId) return;

    try {
      const { error } = await supabase
        .from("victims")
        .delete()
        .eq("id", deletingVictimId);

      if (error) throw error;

      toast({
        title: "Víctima eliminada",
        description: "La víctima se eliminó correctamente",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingVictimId(null);
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
            {victims.map((victim) => (
              <TableRow key={victim.id}>
                <TableCell className="font-medium">{victim.id}</TableCell>
                <TableCell>{victim.full_name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingVictim(victim)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingVictimId(victim.id)}
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

      <VictimDialog
        open={!!editingVictim}
        onOpenChange={(open) => !open && setEditingVictim(null)}
        onSuccess={onUpdate}
        victim={editingVictim}
      />

      <AlertDialog open={!!deletingVictimId} onOpenChange={(open) => !open && setDeletingVictimId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de la víctima.
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