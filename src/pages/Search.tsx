import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionsTable } from "@/components/SessionsTable";

const Search = () => {
  const [filters, setFilters] = useState({
    disco_number: "",
    case_name: "",
    defendant_name: "",
    victim_name: "",
    date_from: "",
    date_to: "",
  });

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ["sessions-search", filters],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select(`
          *,
          victims(id, full_name),
          judges(id, full_name),
          psychologists(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (filters.disco_number) {
        query = query.eq("disco_number", parseInt(filters.disco_number));
      }
      if (filters.case_name) {
        query = query.ilike("case_name", `%${filters.case_name}%`);
      }
      if (filters.defendant_name) {
        query = query.ilike("defendant_name", `%${filters.defendant_name}%`);
      }
      if (filters.date_from) {
        query = query.gte("session_date", filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte("session_date", filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Búsqueda de Sesiones</h1>
        <p className="text-muted-foreground">Buscar y filtrar sesiones de Cámara Gesell registradas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <p className="text-sm text-muted-foreground">Aplicar filtros para refinar los resultados</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disco_number">
                <SearchIcon className="h-4 w-4 inline mr-2" />
                Número de Disco
              </Label>
              <Input
                id="disco_number"
                type="number"
                placeholder="Buscar por N° de disco..."
                value={filters.disco_number}
                onChange={(e) => setFilters({ ...filters, disco_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case_name">Nombre de Causa</Label>
              <Input
                id="case_name"
                placeholder="Buscar por nombre de causa..."
                value={filters.case_name}
                onChange={(e) => setFilters({ ...filters, case_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defendant_name">Juzgado a Cargo</Label>
              <Input
                id="defendant_name"
                placeholder="Buscar por juzgado..."
                value={filters.defendant_name}
                onChange={(e) => setFilters({ ...filters, defendant_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_from">Fecha Desde</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_to">Fecha Hasta</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <SearchIcon className="h-5 w-5 inline mr-2" />
              Resultados de Búsqueda
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {sessions?.length || 0} resultados
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Buscando sesiones...</div>
          ) : sessions && sessions.length > 0 ? (
            <SessionsTable sessions={sessions} onUpdate={refetch} />
          ) : (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No se encontraron sesiones con los filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Search;