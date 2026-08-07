import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Stethoscope, 
  FileText, 
  ClipboardList, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User,
  Clock,
  ExternalLink
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { parseLocal } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

type UnifiedEvent = {
  id: string;
  type: 'consulta' | 'exame' | 'relatorio';
  date: Date;
  dateStr: string;
  title: string;
  subtitle: string;
  familiarId: string;
  familiarNome: string;
  original: any;
};

function getIniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function getEventIcon(type: string) {
  switch (type) {
    case 'consulta': return <Stethoscope className="w-4 h-4 text-blue-500" />;
    case 'exame': return <FileText className="w-4 h-4 text-amber-500" />;
    case 'relatorio': return <ClipboardList className="w-4 h-4 text-emerald-500" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function getEventColor(type: string) {
  switch (type) {
    case 'consulta': return "bg-blue-500/10 border-blue-500/20 text-blue-500";
    case 'exame': return "bg-amber-500/10 border-amber-500/20 text-amber-500";
    case 'relatorio': return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
    default: return "bg-muted border-border text-muted-foreground";
  }
}

export default async function MedicoDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: medico, error: medicoError } = await supabase.from("medicos").select("*").eq("id", id).single();
  if (!medico) {
    throw new Error(`DEBUG_INFO: Medico not found for ID: "${id}". Supabase Error: ${JSON.stringify(medicoError)}`);
  }

  // Fetch Consultas, Exames, Relatorios in parallel
  const [
    { data: consultas },
    { data: exames },
    { data: relatorios }
  ] = await Promise.all([
    supabase.from("consultas").select("*, familiares(*)").eq("medico_id", id),
    supabase.from("exames").select("*, familiares(*)").eq("medico_id", id),
    supabase.from("relatorios").select("*, familiares(*)").eq("medico_id", id)
  ]);

  const allEvents: UnifiedEvent[] = [];

  if (consultas) {
    consultas.forEach((c: any) => {
      const d = c.data_consulta.includes('T') ? c.data_consulta.substring(0, 16) : c.data_consulta;
      allEvents.push({
        id: c.id,
        type: 'consulta',
        date: parseLocal(d),
        dateStr: d,
        title: "Consulta Médica",
        subtitle: c.motivo || c.diagnostico || "Avaliação Geral",
        familiarId: c.familiar_id,
        familiarNome: c.familiares?.nome || "Paciente Desconhecido",
        original: c
      });
    });
  }

  if (exames) {
    exames.forEach((e: any) => {
      const d = e.data_exame.includes('T') ? e.data_exame.substring(0, 16) : e.data_exame;
      allEvents.push({
        id: e.id,
        type: 'exame',
        date: parseLocal(d),
        dateStr: d,
        title: e.nome_exame,
        subtitle: e.tipo_exame || "Exame",
        familiarId: e.familiar_id,
        familiarNome: e.familiares?.nome || "Paciente Desconhecido",
        original: e
      });
    });
  }

  if (relatorios) {
    relatorios.forEach((r: any) => {
      const d = r.data_relatorio.includes('T') ? r.data_relatorio.substring(0, 16) : r.data_relatorio;
      allEvents.push({
        id: r.id,
        type: 'relatorio',
        date: parseLocal(d),
        dateStr: d,
        title: r.titulo,
        subtitle: "Laudo / Relatório",
        familiarId: r.familiar_id,
        familiarNome: r.familiares?.nome || "Paciente Desconhecido",
        original: r
      });
    });
  }

  // Sort descending by date
  allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by familiar_id
  const groupedByPatient: Record<string, { nome: string, events: UnifiedEvent[] }> = {};
  allEvents.forEach(evt => {
    if (!groupedByPatient[evt.familiarId]) {
      groupedByPatient[evt.familiarId] = { nome: evt.familiarNome, events: [] };
    }
    groupedByPatient[evt.familiarId].events.push(evt);
  });

  const patientIds = Object.keys(groupedByPatient);
  const defaultTab = patientIds.length > 0 ? patientIds[0] : "";

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Back Link */}
      <Link href="/medicos" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Médicos
      </Link>

      {/* Doctor Header */}
      <Card className="overflow-hidden border-blue-500/20">
        <div className="h-16 bg-gradient-to-r from-blue-500/10 to-transparent" />
        <CardContent className="pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 -mt-8">
            <Avatar className="w-20 h-20 rounded-xl border-4 border-background shadow-sm bg-background shrink-0">
              <AvatarImage src={medico.foto_url || undefined} alt={medico.nome} className="object-cover" />
              <AvatarFallback className="bg-blue-500/10 text-blue-500 text-2xl font-bold rounded-xl">
                {getIniciais(medico.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-2 sm:pt-8">
              <h1 className="text-2xl font-bold tracking-tight truncate">Dr(a). {medico.nome}</h1>
              <p className="text-blue-500 font-medium">{medico.especialidade}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm text-muted-foreground">
            {medico.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{medico.telefone}</span>
              </div>
            )}
            {medico.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{medico.email}</span>
              </div>
            )}
            {medico.endereco && (
              <div className="flex items-center gap-2 sm:col-span-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{medico.endereco}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs / Dossier Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Histórico de Atendimentos</h2>
        
        {patientIds.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <User className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">
                Nenhum paciente vinculado a este médico até o momento.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Quando uma consulta, exame ou relatório for registrado para este médico, o histórico aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto p-1 bg-muted/50 justify-start">
              {patientIds.map(pid => (
                <TabsTrigger key={pid} value={pid} className="rounded-md">
                  {groupedByPatient[pid].nome}
                </TabsTrigger>
              ))}
            </TabsList>

            {patientIds.map(pid => {
              const patientEvents = groupedByPatient[pid].events;
              const lastConsulta = patientEvents.find(e => e.type === 'consulta');
              
              return (
                <TabsContent key={pid} value={pid} className="space-y-6 focus-visible:outline-none">
                  
                  {/* Última Consulta */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Última Consulta</h3>
                    {lastConsulta ? (
                      <Card className="bg-blue-500/5 border-blue-500/20 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-blue-600/80 dark:text-blue-400 font-medium mb-1">
                                <Calendar className="w-4 h-4" />
                                {format(lastConsulta.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                              </div>
                              <h4 className="text-base font-semibold text-foreground">
                                Paciente: {lastConsulta.familiarNome}
                              </h4>
                            </div>
                            {lastConsulta.original.local_atendimento && (
                              <div className="text-sm text-muted-foreground flex items-start gap-1.5 sm:text-right">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{lastConsulta.original.local_atendimento}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Diagnóstico / Motivo</p>
                              <p className="text-sm text-foreground/90">
                                {lastConsulta.original.diagnostico || lastConsulta.original.motivo || "Não informado."}
                              </p>
                            </div>
                            
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Prescrição</p>
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                {lastConsulta.original.prescricao || "Nenhuma prescrição registrada."}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-4 text-sm text-muted-foreground text-center">
                          Nenhuma consulta registrada com este médico para este paciente. Apenas exames ou laudos.
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Linha do Tempo (Histórico Geral) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Histórico Geral</h3>
                    <div className="relative border-l-2 border-muted ml-3 space-y-6 py-2">
                      {patientEvents.map((evt, idx) => (
                        <div key={`${evt.id}-${idx}`} className="relative pl-6">
                          <div className={`absolute -left-[11px] top-0.5 p-1 rounded-full bg-background border ${getEventColor(evt.type)}`}>
                            {getEventIcon(evt.type)}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold">{evt.title}</h4>
                              <p className="text-sm text-muted-foreground mt-0.5">{evt.subtitle}</p>
                              {evt.original.arquivo_url && (
                                <a 
                                  href={evt.original.arquivo_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Visualizar Arquivo anexado
                                </a>
                              )}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0 self-start border">
                              {format(evt.date, "dd/MM/yyyy")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
