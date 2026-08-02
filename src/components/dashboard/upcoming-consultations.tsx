import { CalendarCheck, Clock, User, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import type { ConsultaComRelacionamentos } from "@/types/database";

interface UpcomingConsultationsProps {
  consultas: ConsultaComRelacionamentos[];
}

/**
 * Formata a data para exibição compacta (ex: "28 Jul" ou "28 Jul, 14:30").
 */
function formatarData(dataString: string): { data: string; hora: string } {
  const date = new Date(dataString);
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const hora = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { data: `${dia} ${mes}`, hora };
}

/**
 * Calcula quantos dias faltam para a consulta.
 */
function diasRestantes(dataString: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataString);
  data.setHours(0, 0, 0, 0);
  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o primeiro e o segundo nome (ex: Maria Clara)
 */
function formatarNome(nome: string): string {
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1]}`;
}

export function UpcomingConsultations({
  consultas,
}: UpcomingConsultationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-blue-500" />
          Próximas Consultas
        </CardTitle>
      </CardHeader>

      <CardContent>
        {consultas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              <CalendarCheck className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta agendada
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {consultas.map((consulta) => {
              const { data, hora } = formatarData(consulta.data_consulta);
              const dias = diasRestantes(consulta.data_consulta);
              const urgente = dias <= 2;

              return (
                <Link
                  key={consulta.id}
                  href={`/consultas/${consulta.id}/editar`}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-accent/30 transition-all duration-200 hover:bg-accent/50 group"
                >
                  {/* Data badge */}
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-blue-500/10 shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <span className="text-xs font-bold text-blue-500 leading-none" suppressHydrationWarning>
                      {data.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-blue-400 uppercase leading-none mt-0.5" suppressHydrationWarning>
                      {data.split(" ")[1]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-blue-500 transition-colors">
                        {consulta.motivo || "Consulta médica"}
                      </span>
                      {urgente && (
                        <Badge variant="destructive" className="text-[10px] h-4">
                          Em breve
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground flex-wrap">
                      {consulta.pacientes && (
                        <span className="flex items-center gap-1.5">
                          <Avatar className="w-4 h-4 border border-border">
                            <AvatarImage src={consulta.pacientes.foto_url || undefined} alt={consulta.pacientes.nome} className="object-cover" />
                            <AvatarFallback className="bg-emerald-500/10 text-emerald-500 text-[8px] font-medium">
                              {consulta.pacientes.nome[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {formatarNome(consulta.pacientes.nome)}
                        </span>
                      )}
                      {(() => {
                        const especialidade = consulta.medicos?.especialidade || consulta.especialidade;
                        return especialidade ? (
                          <span className="flex items-center gap-1 text-blue-500 font-medium">
                            <Stethoscope className="w-3 h-3" />
                            {especialidade}
                          </span>
                        ) : null;
                      })()}
                      
                      {(consulta.medicos || consulta.local_atendimento) && (
                        <span className="flex items-center gap-1.5">
                          {consulta.medicos?.foto_url && (
                            <Avatar className="w-4 h-4 border border-border">
                              <AvatarImage src={consulta.medicos.foto_url} alt={consulta.medicos.nome} className="object-cover" />
                              <AvatarFallback className="bg-blue-500/10 text-blue-500 text-[8px] font-medium">
                                {consulta.medicos.nome[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {consulta.medicos ? `Dr. ${consulta.medicos.nome.split(" ")[0]}` : consulta.local_atendimento}
                        </span>
                      )}
                      <span className="flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-3 h-3" />
                        {hora}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
