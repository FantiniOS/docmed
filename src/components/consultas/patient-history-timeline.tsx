"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Stethoscope, FileText, CalendarCheck, ChevronDown, ChevronUp, Pill } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PatientHistoryTimelineProps {
  pacienteId: string;
  currentConsultaId?: string;
  medicoId?: string | null;
  especialidade?: string | null;
}

type TimelineEvent = {
  id: string;
  type: "consulta" | "exame";
  date: Date;
  title: string;
  medico: string | null;
  especialidade: string | null;
  resumo: string | null;
  tags: string[];
};

export function PatientHistoryTimeline({
  pacienteId,
  currentConsultaId,
  medicoId,
  especialidade,
}: PatientHistoryTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchHistory() {
      if (!pacienteId) {
        setEvents([]);
        return;
      }

      setIsLoading(true);

      try {
        const [consultasRes] = await Promise.all([
          supabase
            .from("consultas")
            .select("*, medicos(*)")
            .eq("paciente_id", pacienteId)
            .order("data_consulta", { ascending: false }),
        ]);

        let history: TimelineEvent[] = [];

        if (consultasRes.data) {
          const hoje = new Date();

          for (const c of consultasRes.data) {
            if (c.id === currentConsultaId) continue;

            const dataConsulta = new Date(c.data_consulta);
            // Regra A: Apenas Passado
            if (dataConsulta > hoje) continue;

            const docId = c.medico_id;
            const docEspec = c.medicos?.especialidade || c.especialidade || null;

            // Regra B: Mesmo Médico (ou especialidade)
            const matchesMedico = medicoId && docId === medicoId;
            const matchesEspecialidade = especialidade && docEspec === especialidade;
            if (!matchesMedico && !matchesEspecialidade) continue;

            // Regra C: Apenas Consultas (já estamos filtrando só na tabela consultas)
            const tags: string[] = [];
            if (c.prescricao) tags.push("Prescrição");
            if (c.diagnostico) tags.push("Diagnóstico");

            history.push({
              id: `consulta-${c.id}`,
              type: "consulta",
              date: dataConsulta,
              title: c.motivo || "Consulta",
              medico: c.medicos ? `Dr(a). ${c.medicos.nome}` : null,
              especialidade: docEspec,
              resumo: c.diagnostico || c.prescricao || "Sem anotações detalhadas.",
              tags,
            });
          }
        }

        // Ordenação
        history.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        // Última Visita Exclusiva
        history = history.slice(0, 1);
        
        setEvents(history);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [pacienteId, currentConsultaId, medicoId, especialidade]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!pacienteId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-border h-full min-h-[300px]">
        <Stethoscope className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">
          Preencha o formulário
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione o paciente e o médico para visualizar o histórico.
        </p>
      </div>
    );
  }

  if (!medicoId && !especialidade) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-border h-full min-h-[300px]">
        <Stethoscope className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">
          Histórico Médico
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione o Médico Solicitante ou a Especialidade no formulário.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 rounded-xl border border-border p-4 h-full min-h-[300px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 shrink-0 pb-3 border-b border-border/50">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Histórico do Paciente</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-muted rounded-lg h-24 w-full"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum histórico de evolução anterior com este médico.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border/70 ml-3 py-2 space-y-6">
            {events.map((event) => {
              const isExpanded = expandedItems.has(event.id);

              return (
                <div key={event.id} className="relative pl-6">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-gray-50 ${
                      event.type === "consulta"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  />

                  {/* Date context */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground capitalize">
                      {formatDistanceToNow(event.date, {
                        locale: ptBR,
                        addSuffix: true,
                      })}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/80" suppressHydrationWarning>
                      {format(event.date, "dd/MM/yy")}
                    </span>
                  </div>

                  {/* Content Card */}
                  <div className="bg-background rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-2 mb-2">
                      {event.type === "consulta" ? (
                        <CalendarCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {event.title}
                        </p>
                        {(event.medico || event.especialidade) && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Stethoscope className="w-3 h-3" />
                            <span>
                              {event.especialidade}
                              {event.medico && event.especialidade && " • "}
                              {event.medico}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {event.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[9px] h-4 px-1.5 py-0 font-medium bg-muted/60 text-muted-foreground"
                          >
                            {tag === "Prescrição" && (
                              <Pill className="w-2.5 h-2.5 mr-1" />
                            )}
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Resumo */}
                    {event.resumo && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                        <p
                          className={`${
                            isExpanded ? "" : "line-clamp-2"
                          } leading-relaxed`}
                        >
                          {event.resumo}
                        </p>
                        {event.resumo.length > 80 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-0 mt-1 text-[10px] text-primary hover:bg-transparent"
                            onClick={() => toggleExpand(event.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" /> Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" /> Ver mais
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
