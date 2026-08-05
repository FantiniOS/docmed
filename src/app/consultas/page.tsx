import Link from "next/link";
import { CalendarCheck, Plus, Search } from "lucide-react";
import { ConsultaList } from "@/components/consultas/consulta-list";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConsultaComRelacionamentos } from "@/types/database";



export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { q } = await searchParams;

  // Em um caso real complexo com Supabase, a busca textual (q) 
  // pode precisar de uma view ou RPC para buscar em relacionamentos.
  // Para MVP, vamos trazer as consultas ordenadas.
  let query = supabase
    .from("consultas")
    .select("*, familiares(*), medicos(*)")
    .order("data_consulta", { ascending: false });

  const { data: consultas, error } = await query;
  let list = (consultas as ConsultaComRelacionamentos[]) || [];

  // Filtro simplificado no client para o MVP, já que as tabelas relacionadas
  // complicam o `.ilike()` direto no Supabase.
  if (q) {
    const termo = q.toLowerCase();
    list = list.filter(
      (c) =>
        c.motivo?.toLowerCase().includes(termo) ||
        c.familiares?.nome?.toLowerCase().includes(termo) ||
        c.medicos?.nome?.toLowerCase().includes(termo) ||
        c.local_atendimento?.toLowerCase().includes(termo)
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-500" />
            Consultas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico e próximos agendamentos médicos.
          </p>
        </div>
        <Link
          href="/consultas/novo"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Agendar Consulta
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <form>
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por paciente, médico ou motivo..."
            className="pl-9 h-9"
          />
        </form>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <CalendarCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Nenhuma consulta encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {q
                  ? "Não foram encontrados resultados para a sua busca."
                  : "Não há registros de consultas. Agende uma nova consulta para acompanhar."}
              </p>
            </div>
            {!q && (
              <Link
                href="/consultas/novo"
                className="mt-2 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <ConsultaList initialConsultas={list} />
      )}
    </div>
  );
}
