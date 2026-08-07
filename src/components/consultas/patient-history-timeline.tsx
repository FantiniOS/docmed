"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Stethoscope, FileText, CalendarCheck, ClipboardList, Pill, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface PatientHistoryTimelineProps {
  familiarId: string;
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
  diagnostico: string | null;
  prescricao: string | null;
  local: string | null;
  tipoConsulta: string | null;
};

export function PatientHistoryTimeline({
  familiarId,
  currentConsultaId,
  medicoId,
  especialidade,
}: PatientHistoryTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!familiarId) {
        setEvents([]);
        return;
      }

      setIsLoading(true);

      try {
        const [consultasRes] = await Promise.all([
          supabase
            .from("consultas")
            .select("*, medicos(*)")
            .eq("familiar_id", familiarId)
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
            
            const normalizeStr = (s: string | null | undefined) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
            const normFilterEspec = normalizeStr(especialidade);
            const normConsEspec = normalizeStr(c.especialidade);
            const normMedEspec = normalizeStr(c.medicos?.especialidade);
            
            const checkSimilarRoot = (a: string, b: string) => {
              if (!a || !b) return false;
              if (a.includes(b) || b.includes(a)) return true;
              const w1 = a.split(/\s+/).filter(w => w.length > 4);
              const w2 = b.split(/\s+/).filter(w => w.length > 4);
              for (const x of w1) {
                for (const y of w2) {
                  if (x.substring(0, 5) === y.substring(0, 5)) return true;
                }
              }
              return false;
            };
            
            const matchesEspecialidade = especialidade && (
              checkSimilarRoot(normConsEspec, normFilterEspec) || 
              checkSimilarRoot(normMedEspec, normFilterEspec)
            );
            
            if (!matchesMedico && !matchesEspecialidade) continue;

            history.push({
              id: `consulta-${c.id}`,
              type: "consulta",
              date: dataConsulta,
              title: c.motivo || "Consulta",
              medico: c.medicos ? `Dr(a). ${c.medicos.nome}` : null,
              especialidade: docEspec,
              diagnostico: c.diagnostico || null,
              prescricao: c.prescricao || null,
              local: c.local_atendimento || null,
              tipoConsulta: c.tipo_consulta || null,
            });
          }
        }

        // Ordenação cronológica (mais recente primeiro)
        history.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Mostrar até 10 consultas para dar um panorama completo
        history = history.slice(0, 10);

        setEvents(history);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [familiarId, currentConsultaId, medicoId, especialidade]);

  if (!familiarId) {
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
      <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Prontuário — Evolução</h3>
        </div>
        {events.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium">
            {events.length} registro{events.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-muted rounded-lg h-32 w-full"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <FileText className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum registro de evolução anterior com este médico.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-blue-200 ml-3 py-2 space-y-5">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-6">
                {/* Dot com número */}
                <div className="absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center ring-3 ring-gray-50">
                  {index + 1}
                </div>

                {/* Prontuário Card */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  {/* Header do registro */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30 rounded-t-lg">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <CalendarCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span suppressHydrationWarning>
                        {format(event.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground italic capitalize" suppressHydrationWarning>
                      {formatDistanceToNow(event.date, { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>

                  {/* Corpo do prontuário */}
                  <div className="p-3 space-y-2.5">
                    {/* Motivo / Queixa Principal */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Queixa / Motivo
                      </span>
                      <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                        {event.title}
                      </p>
                    </div>

                    {/* Diagnóstico */}
                    {event.diagnostico && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Diagnóstico
                        </span>
                        <p className="text-xs text-foreground mt-0.5 leading-relaxed whitespace-pre-wrap">
                          {event.diagnostico}
                        </p>
                      </div>
                    )}

                    {/* Prescrição */}
                    {event.prescricao && (
                      <div>
                        <div className="flex items-center gap-1">
                          <Pill className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            Prescrição
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-0.5 leading-relaxed whitespace-pre-wrap">
                          {event.prescricao}
                        </p>
                      </div>
                    )}

                    {/* Metadata: Médico, Local, Tipo */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1.5 border-t border-dashed border-border/50 text-[10px] text-muted-foreground">
                      {event.medico && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          {event.medico}
                        </span>
                      )}
                      {event.especialidade && (
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal border-blue-200 text-blue-600">
                            {event.especialidade}
                          </Badge>
                        </span>
                      )}
                      {event.local && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.local}
                        </span>
                      )}
                      {event.tipoConsulta && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal">
                          {event.tipoConsulta}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
