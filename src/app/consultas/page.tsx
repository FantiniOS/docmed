import Link from "next/link";
import { CalendarCheck, Plus, Search, User, Stethoscope, Clock } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConsultaComRelacionamentos } from "@/types/database";

function formatarData(dataString: string): { data: string; hora: string } {
  const date = new Date(dataString);
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const ano = date.getFullYear();
  const hora = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { data: `${dia} ${mes} ${ano}`, hora };
}

function getStatusBadge(dataString: string) {
  const data = new Date(dataString);
  const hoje = new Date();
  
  if (data < hoje) {
    return <Badge variant="secondary">Realizada</Badge>;
  }
  
  const diferenca = data.getTime() - hoje.getTime();
  const dias = Math.ceil(diferenca / (1000 * 3600 * 24));
  
  if (dias <= 2) {
    return <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 text-white">Próxima</Badge>;
  }
  
  return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Agendada</Badge>;
}

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
        <div className="grid gap-2">
          {list.map((consulta) => {
            const { data, hora } = formatarData(consulta.data_consulta);
            
            return (
              <Card key={consulta.id} className="group transition-all duration-200 hover:shadow-md hover:border-blue-500/30 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Data/Hora Section (Esquerda no desktop) */}
                    <div className="bg-muted/30 p-3 sm:w-36 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-border shrink-0">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground" suppressHydrationWarning>{data}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                          <Clock className="w-3 h-3" /> {hora}
                        </span>
                      </div>
                      <div className="sm:mt-2" suppressHydrationWarning>
                        {getStatusBadge(consulta.data_consulta)}
                      </div>
                    </div>

                    {/* Informações Section */}
                    <div className="p-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                            {consulta.motivo || "Consulta de Rotina"}
                          </h3>
                          {consulta.tipo_consulta && (
                            <Badge variant="outline" className="mt-1 text-xs font-normal">
                              {consulta.tipo_consulta}
                            </Badge>
                          )}
                        </div>
                        <Link
                          href={`/consultas/${consulta.id}/editar`}
                          className="text-muted-foreground hover:text-blue-500 transition-colors shrink-0 p-1"
                          title="Editar Consulta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {consulta.familiares?.foto_url ? (
                            <Avatar className="w-5 h-5 border border-border">
                              <AvatarImage src={consulta.familiares.foto_url} alt="Paciente" className="object-cover" />
                              <AvatarFallback className="text-[10px] bg-emerald-500/10 text-emerald-500">{consulta.familiares.nome[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <User className="w-4 h-4 shrink-0 text-emerald-500" />
                          )}
                          <span className="truncate">{consulta.familiares?.nome || "Paciente"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {consulta.medicos?.foto_url ? (
                            <Avatar className="w-5 h-5 border border-border">
                              <AvatarImage src={consulta.medicos.foto_url} alt="Médico" className="object-cover" />
                              <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-500">{consulta.medicos.nome[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <Stethoscope className="w-4 h-4 shrink-0 text-blue-500" />
                          )}
                          <span className="truncate">
                            {consulta.medicos?.nome
                              ? `Dr(a). ${consulta.medicos.nome}`
                              : consulta.local_atendimento
                              ? consulta.local_atendimento
                              : "Não informado"}
                          </span>
                        </div>
                      </div>

                      {(consulta.diagnostico || consulta.prescricao) && (
                        <div className="mt-3 pt-2 border-t border-border grid sm:grid-cols-2 gap-2">
                          {consulta.diagnostico && (
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Diagnóstico</span>
                              <p className="text-xs mt-0.5 text-foreground">{consulta.diagnostico}</p>
                            </div>
                          )}
                          {consulta.prescricao && (
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Prescrição</span>
                              <p className="text-xs mt-0.5 text-foreground">{consulta.prescricao}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
