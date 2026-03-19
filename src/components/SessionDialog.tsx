import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  session?: any;
}

export function SessionDialog({ open, onOpenChange, onSuccess, session }: SessionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    disco_number: "",
    session_date: "",
    case_name: "",
    court_id: "",
    victim_name: "",
    oficio_number: "",
    cantidad_copias: "",
    judge_id: "",
    psychologist_id: "",
  });

  const { data: judges } = useQuery({
    queryKey: ["judges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("judges").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: psychologists } = useQuery({
    queryKey: ["psychologists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("psychologists").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (session) {
      setFormData({
        disco_number: session.disco_number.toString(),
        session_date: new Date(session.session_date).toISOString().slice(0, 16),
        case_name: session.case_name,
        defendant_name: session.defendant_name,
        victim_name: session.victim_name || session.victims?.full_name || "",
        oficio_number: session.oficio_number || "",
        cantidad_copias: session.cantidad_copias?.toString() || "",
        judge_id: session.judge_id?.toString() || "",
        psychologist_id: session.psychologist_id?.toString() || "",
      });
    } else {
      setFormData({
        disco_number: "",
        session_date: "",
        case_name: "",
        defendant_name: "",
        victim_name: "",
        oficio_number: "",
        cantidad_copias: "",
        judge_id: "",
        psychologist_id: "",
      });
    }
  }, [session, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const payload = {
        disco_number: parseInt(formData.disco_number),
        session_date: formData.session_date,
        case_name: formData.case_name,
        defendant_name: formData.defendant_name,
        victim_name: formData.victim_name || null,
        oficio_number: formData.oficio_number || null,
        cantidad_copias: formData.cantidad_copias ? parseInt(formData.cantidad_copias) : null,
        judge_id: formData.judge_id ? parseInt(formData.judge_id) : null,
        psychologist_id: formData.psychologist_id ? parseInt(formData.psychologist_id) : null,
        user_id: user.id,
      };

      if (session) {
        const { error } = await supabase
          .from("sessions")
          .update(payload)
          .eq("id", session.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sessions").insert(payload);
        if (error) throw error;
      }

      toast({
        title: session ? "Sesión actualizada" : "Sesión creada",
        description: session ? "La sesión se actualizó correctamente" : "La sesión se creó correctamente",
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? "Editar Sesión" : "Nueva Sesión"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete los datos de la sesión de Cámara Gesell
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disco_number">N° de Disco</Label>
            <Input
              id="disco_number"
              type="number"
              placeholder="8"
              value={formData.disco_number}
              onChange={(e) => setFormData({ ...formData, disco_number: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_date">Fecha y Hora</Label>
            <Input
              id="session_date"
              type="datetime-local"
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="case_name">Nombre de la Causa</Label>
            <Input
              id="case_name"
              placeholder="Ej: Causa 123/2025 - Caso XXX"
              value={formData.case_name}
              onChange={(e) => setFormData({ ...formData, case_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defendant_name">Juzgado a Cargo</Label>
            <Input
              id="defendant_name"
              placeholder="Ej: Juzgado de Instrucción N° 5"
              value={formData.defendant_name}
              onChange={(e) => setFormData({ ...formData, defendant_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oficio_number">N° de Oficio</Label>
            <Input
              id="oficio_number"
              placeholder="Ej: 190/2024"
              value={formData.oficio_number}
              onChange={(e) => setFormData({ ...formData, oficio_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cantidad_copias">Cantidad de Copias</Label>
            <Input
              id="cantidad_copias"
              type="number"
              placeholder="1"
              value={formData.cantidad_copias}
              onChange={(e) => setFormData({ ...formData, cantidad_copias: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge_id">Juez/a Presente</Label>
            <Select value={formData.judge_id} onValueChange={(value) => setFormData({ ...formData, judge_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un juez/a" />
              </SelectTrigger>
              <SelectContent>
                {judges?.map((judge) => (
                  <SelectItem key={judge.id} value={judge.id.toString()}>
                    {judge.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="psychologist_id">Psicólogo/a a Cargo</Label>
            <Select value={formData.psychologist_id} onValueChange={(value) => setFormData({ ...formData, psychologist_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un psicólogo/a" />
              </SelectTrigger>
              <SelectContent>
                {psychologists?.map((psychologist) => (
                  <SelectItem key={psychologist.id} value={psychologist.id.toString()}>
                    {psychologist.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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