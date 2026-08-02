import {
  AlertCircle,
  CalendarCheck,
  FileText,
  Clock,
  MapPin,
  Stethoscope,
  ClipboardList,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  ConsultaComRelacionamentos,
  ExameComRelacionamentos,
} from "@/types/database";

interface SmartAlertsProps {
  consultas: ConsultaComRelacionamentos[];
  exames: ExameComRelacionamentos[];
}

/**
 * Calcula a diferença em dias entre uma data e hoje.
 */
function diffDias(dataString: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataString);
  data.setHours(0, 0, 0, 0);
  return Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o label relativo ("Hoje", "Amanhã", "Em 2 dias").
 */
function getLabelRelativo(diff: number): string {
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return "Em 2 dias";
}

/**
 * Retorna a variante visual baseada na proximidade.
 */
function getBadgeVariant(diff: number): "destructive" | "secondary" | "outline" {
  if (diff === 0) return "destructive";
  if (diff === 1) return "secondary";
  return "outline";
}

/**
 * Formata data/hora para exibição legível.
 */
function formatarDataHora(dataString: string): { data: string; hora: string } {
  const date = new Date(dataString);
  const data = date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const hora = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { data, hora };
}

/**
 * Smart Alerts — "Atenção Plena"
 *
 * Renderiza cards de alerta SOMENTE para eventos nos próximos 2 dias (hoje, amanhã, depois de amanhã).
 * Se não houver eventos nessa janela, retorna null para manter a tela limpa.
 */
export function SmartAlerts({ consultas, exames }: SmartAlertsProps) {
  // Filtrar eventos que estão dentro da janela de 2 dias
  const consultasProximas = consultas.filter((c) => {
    const diff = diffDias(c.data_consulta);
    return diff >= 0 && diff <= 2;
  });

  const examesProximos = exames.filter((e) => {
    const diff = diffDias(e.data_exame);
    return diff >= 0 && diff <= 2;
  });

  // Se não houver eventos na janela de 2 dias, renderizar null
  if (consultasProximas.length === 0 && examesProximos.length === 0) {
    return null;
  }

  return (
    <section id="smart-alerts" className="space-y-3">
      {/* Header da seção */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10">
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Atenção Plena
          </h2>
          <p className="text-xs text-muted-foreground">
            Compromissos nos próximos dias
          </p>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {/* Consultas próximas */}
        {consultasProximas.map((consulta) => {
          const diff = diffDias(consulta.data_consulta);
          const { data, hora } = formatarDataHora(consulta.data_consulta);
          const especialidade =
            consulta.medicos?.especialidade || consulta.especialidade;
          const orientacoes = consulta.prescricao || consulta.diagnostico;

          return (
            <Card
              key={`consulta-${consulta.id}`}
              className="border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
            >
              <CardContent className="space-y-2.5">
                {/* Header: tipo + badge de urgência */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                      Consulta
                    </span>
                  </div>
                  <Badge
                    variant={getBadgeVariant(diff)}
                    className="text-[10px] h-5"
                  >
                    {diff === 0 && "🔔 "}
                    {getLabelRelativo(diff)}
                  </Badge>
                </div>

                {/* Motivo / Título */}
                <p className="text-sm font-medium text-foreground leading-snug">
                  {consulta.motivo || "Consulta médica"}
                </p>

                {/* Detalhes */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" suppressHydrationWarning>
                    <Clock className="w-3 h-3 shrink-0" />
                    <span suppressHydrationWarning>
                      {data} · {hora}
                    </span>
                  </div>

                  {consulta.medicos && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 shrink-0" />
                      <span>Dr(a). {consulta.medicos.nome}</span>
                    </div>
                  )}

                  {especialidade && (
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3 h-3 shrink-0" />
                      <span className="text-blue-500 font-medium">
                        {especialidade}
                      </span>
                    </div>
                  )}

                  {consulta.local_atendimento && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{consulta.local_atendimento}</span>
                    </div>
                  )}
                </div>

                {/* Orientações / Preparo */}
                {orientacoes && (
                  <div className="mt-1 p-2 rounded-md bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-1 mb-1">
                      <ClipboardList className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                        Orientações
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {orientacoes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Exames próximos */}
        {examesProximos.map((exame) => {
          const diff = diffDias(exame.data_exame);
          const { data, hora } = formatarDataHora(exame.data_exame);

          return (
            <Card
              key={`exame-${exame.id}`}
              className="border-l-4 border-l-amber-500 transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
            >
              <CardContent className="space-y-2.5">
                {/* Header: tipo + badge de urgência */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      Exame
                    </span>
                  </div>
                  <Badge
                    variant={getBadgeVariant(diff)}
                    className="text-[10px] h-5"
                  >
                    {diff === 0 && "🔔 "}
                    {getLabelRelativo(diff)}
                  </Badge>
                </div>

                {/* Nome do exame */}
                <p className="text-sm font-medium text-foreground leading-snug">
                  {exame.nome_exame}
                </p>

                {/* Detalhes */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" suppressHydrationWarning>
                    <Clock className="w-3 h-3 shrink-0" />
                    <span suppressHydrationWarning>
                      {data} · {hora}
                    </span>
                  </div>

                  {exame.medicos && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 shrink-0" />
                      <span>Dr(a). {exame.medicos.nome}</span>
                    </div>
                  )}

                  {exame.local_atendimento && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{exame.local_atendimento}</span>
                    </div>
                  )}
                </div>

                {/* Orientações / Preparo */}
                {exame.observacoes && (
                  <div className="mt-1 p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-1 mb-1">
                      <ClipboardList className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                        Preparo / Orientações
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {exame.observacoes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
