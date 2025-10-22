import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VictimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  victim?: any;
}

export function VictimDialog({ open, onOpenChange, onSuccess, victim }: VictimDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (victim) {
      setFullName(victim.full_name);
    } else {
      setFullName("");
    }
  }, [victim, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (victim) {
        const { error } = await supabase
          .from("victims")
          .update({ full_name: fullName })
          .eq("id", victim.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("victims")
          .insert({ full_name: fullName, user_id: user.id });
        if (error) throw error;
      }

      toast({
        title: victim ? "Víctima actualizada" : "Víctima creada",
        description: victim ? "La víctima se actualizó correctamente" : "La víctima se creó correctamente",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{victim ? "Editar Víctima" : "Nueva Víctima"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete la información de la víctima
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">ID de Víctima</Label>
            <Input
              id="id"
              value={victim?.id || "Auto-generado"}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              placeholder="Nombre completo de la víctima"
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