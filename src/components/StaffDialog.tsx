import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  type: "judges" | "psychologists" | "courts";
  staff?: any;
}

export function StaffDialog({ open, onOpenChange, onSuccess, type, staff }: StaffDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (staff) {
      setFullName(staff.full_name);
    } else {
      setFullName("");
    }
  }, [staff, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const table = type;

      if (staff) {
        const { error } = await supabase
          .from(table)
          .update({ full_name: fullName })
          .eq("id", staff.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ full_name: fullName, user_id: user.id });
        if (error) throw error;
      }

      const label = type === "judges" ? "Juez/a" : type === "psychologists" ? "Psicólogo/a" : "Juzgado";
      toast({
        title: staff ? `${label} actualizado` : `${label} creado`,
        description: staff ? `${label} se actualizó correctamente` : `${label} se creó correctamente`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const labelMap = { judges: "Juez/a", psychologists: "Psicólogo/a", courts: "Juzgado" };
  const descMap = {
    judges: "Complete la información del juez o jueza",
    psychologists: "Complete la información del psicólogo o psicóloga",
    courts: "Complete la información del juzgado o fiscalía",
  };
  const label = labelMap[type];
  const title = staff ? `Editar ${label}` : `Nuevo ${label}`;
  const description = descMap[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              placeholder={type === "courts" ? "Nombre del juzgado o fiscalía" : `Nombre completo del ${type === "judges" ? "juez o jueza" : "psicólogo o psicóloga"}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}