import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SessionDialog } from "@/components/SessionDialog";
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

interface SessionsTableProps {
  sessions: any[];
  onUpdate: () => void;
  isAdmin?: boolean;
}

export function SessionsTable({ sessions, onUpdate, isAdmin = false }: SessionsTableProps) {
  const { toast } = useToast();
  const [editingSession, setEditingSession] = useState<any>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingSessionId) return;

    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", deletingSessionId);

      if (error) throw error;

      toast({
        title: "Sesión eliminada",
        description: "La sesión se eliminó correctamente",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Disco</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Causa</TableHead>
              <TableHead>Juzgado</TableHead>
              <TableHead>Víctima</TableHead>
              <TableHead>Juez/a</TableHead>
              <TableHead>Psicólogo/a</TableHead>
              {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.disco_number}</TableCell>
                <TableCell>
                  {format(new Date(session.session_date), "dd/MM/yyyy HH:mm", { locale: es })}
                </TableCell>
                <TableCell>{session.case_name}</TableCell>
                <TableCell>{session.defendant_name}</TableCell>
                <TableCell>{session.victim_name || session.victims?.full_name || "-"}</TableCell>
                <TableCell>{session.judges?.full_name || "-"}</TableCell>
                <TableCell>{session.psychologists?.full_name || "-"}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSession(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSessionId(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SessionDialog
        open={!!editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
        onSuccess={onUpdate}
        session={editingSession}
      />

      <AlertDialog open={!!deletingSessionId} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la sesión.
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