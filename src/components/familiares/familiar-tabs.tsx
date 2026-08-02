"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, FileText, Stethoscope, Clock, Calendar, Droplet, ClipboardList, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConsultaComRelacionamentos, ExameComRelacionamentos, RelatorioComRelacionamentos } from "@/types/database";

interface FamiliarTabsProps {
  consultas: ConsultaComRelacionamentos[];
  exames: ExameComRelacionamentos[];
  relatorios: RelatorioComRelacionamentos[];
}

export function FamiliarTabs({ consultas, exames, relatorios }: FamiliarTabsProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"consultas" | "exames" | "laudos" | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroMedico, setFiltroMedico] = useState("");

  const medicosUnicos = useMemo(() => {
    const medicos = new Map<string, string>();
    [...consultas, ...exames, ...relatorios].forEach((item) => {
      if (item.medicos?.id && item.medicos?.nome) {
        medicos.set(item.medicos.id, item.medicos.nome);
      }
    });
    return Array.from(medicos.entries());
  }, [consultas, exames, relatorios]);

  const consultasFiltradas = consultas.filter((c) => {
    const bateTexto = termoBusca === "" || 
      c.motivo?.toLowerCase().includes(termoBusca.toLowerCase()) || 
      c.diagnostico?.toLowerCase().includes(termoBusca.toLowerCase()) ||
      c.prescricao?.toLowerCase().includes(termoBusca.toLowerCase());
    const bateMedico = filtroMedico === "" || filtroMedico === "todos" || c.medico_id === filtroMedico;
    return bateTexto && bateMedico;
  });

  const examesFiltrados = exames.filter((e) => {
    const bateTexto = termoBusca === "" || 
      e.nome_exame?.toLowerCase().includes(termoBusca.toLowerCase()) || 
      e.observacoes?.toLowerCase().includes(termoBusca.toLowerCase());
    const bateMedico = filtroMedico === "" || filtroMedico === "todos" || e.medico_id === filtroMedico;
    return bateTexto && bateMedico;
  });

  const relatoriosFiltrados = relatorios.filter((r) => {
    const bateTexto = termoBusca === "" || 
      r.titulo?.toLowerCase().includes(termoBusca.toLowerCase()) || 
      r.observacoes?.toLowerCase().includes(termoBusca.toLowerCase());
    const bateMedico = filtroMedico === "" || filtroMedico === "todos" || r.medico_id === filtroMedico;
    return bateTexto && bateMedico;
  });

  const clearFilters = () => {
    setTermoBusca("");
    setFiltroMedico("");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Tab Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant={activeView === "consultas" ? "default" : "outline"}
          className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
            activeView === "consultas" ? "bg-blue-600 hover:bg-blue-700 shadow-md ring-2 ring-blue-500/20" : "bg-card hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => setActiveView(activeView === "consultas" ? null : "consultas")}
        >
          <CalendarCheck className={`w-5 h-5 ${activeView === "consultas" ? "text-white" : "text-blue-500"}`} />
          <span className="text-xs font-semibold">Consultas</span>
        </Button>

        <Button
          variant={activeView === "exames" ? "default" : "outline"}
          className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
            activeView === "exames" ? "bg-amber-500 hover:bg-amber-600 shadow-md ring-2 ring-amber-500/20" : "bg-card hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => setActiveView(activeView === "exames" ? null : "exames")}
        >
          <Droplet className={`w-5 h-5 ${activeView === "exames" ? "text-white" : "text-amber-500"}`} />
          <span className="text-xs font-semibold">Exames</span>
        </Button>

        <Button
          variant={activeView === "laudos" ? "default" : "outline"}
          className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
            activeView === "laudos" ? "bg-emerald-600 hover:bg-emerald-700 shadow-md ring-2 ring-emerald-500/20" : "bg-card hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => setActiveView(activeView === "laudos" ? null : "laudos")}
        >
          <ClipboardList className={`w-5 h-5 ${activeView === "laudos" ? "text-white" : "text-emerald-500"}`} />
          <span className="text-xs font-semibold">Laudos</span>
        </Button>
      </div>

      {/* Conditionally Rendered Content */}
      <div className="mt-6">
        {/* Toolbar de Filtros */}
        {activeView && (
          <div className="flex flex-col md:flex-row gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por exame, queixa ou observação..."
                className="pl-9 h-10"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
            <Select value={filtroMedico} onValueChange={(val) => setFiltroMedico(val || "")}>
              <SelectTrigger className="w-full md:w-[220px] h-10">
                <SelectValue placeholder="Filtrar por Médico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Médicos</SelectItem>
                {medicosUnicos.map(([id, nome]) => (
                  <SelectItem key={id} value={id}>
                    Dr(a). {nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(termoBusca || (filtroMedico && filtroMedico !== "todos")) && (
              <Button variant="ghost" className="h-10 px-3 shrink-0 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        )}

        {/* Consultas */}
        {activeView === "consultas" && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <CalendarCheck className="w-5 h-5 text-blue-500" />
              Histórico de Consultas
            </h2>

            {consultasFiltradas.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                  <CalendarCheck className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma consulta encontrada com os filtros atuais.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {consultasFiltradas.map((consulta) => (
                  <Card 
                    key={consulta.id} 
                    className="transition-all duration-200 hover:bg-accent/50 cursor-pointer border-transparent hover:border-blue-500/30 shadow-sm hover:shadow-md"
                    onClick={() => router.push(`/consultas/${consulta.id}/editar`)}
                  >
                    <CardContent className="flex items-start gap-4 py-4">
                      {/* Data visual */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 shrink-0">
                        <Calendar className="w-4 h-4 text-blue-500 mb-0.5" />
                        <span className="text-[10px] text-blue-600 font-medium" suppressHydrationWarning>
                          {new Date(consulta.data_consulta).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {consulta.motivo || "Consulta Clínica"}
                          </span>
                          {consulta.tipo_consulta && (
                            <Badge variant="secondary" className="text-[10px]">
                              {consulta.tipo_consulta}
                            </Badge>
                          )}
                        </div>

                        {consulta.medicos && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Stethoscope className="w-3 h-3" />
                            Dr(a). {consulta.medicos.nome}
                            {consulta.medicos.especialidade && (
                              <span>— {consulta.medicos.especialidade}</span>
                            )}
                          </p>
                        )}

                        {(consulta.diagnostico || consulta.prescricao) && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                            <p className="line-clamp-2">
                              {consulta.diagnostico || consulta.prescricao}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exames */}
        {activeView === "exames" && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Droplet className="w-5 h-5 text-amber-500" />
              Últimos Exames
            </h2>

            {examesFiltrados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum exame encontrado com os filtros atuais.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {examesFiltrados.map((exame) => (
                  <Card 
                    key={exame.id} 
                    className="transition-all duration-200 hover:bg-accent/50 cursor-pointer border-transparent hover:border-amber-500/30 shadow-sm hover:shadow-md"
                    onClick={() => router.push(`/exames/${exame.id}/editar`)}
                  >
                    <CardContent className="flex items-start gap-4 py-4">
                      {/* Data visual */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-amber-500/10 shrink-0">
                        <Calendar className="w-4 h-4 text-amber-500 mb-0.5" />
                        <span className="text-[10px] text-amber-500 font-medium" suppressHydrationWarning>
                          {new Date(exame.data_exame).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {exame.nome_exame}
                          </span>
                          {exame.tipo_exame && (
                            <Badge variant="secondary" className="text-[10px]">
                              {exame.tipo_exame}
                            </Badge>
                          )}
                        </div>

                        {exame.medicos && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Stethoscope className="w-3 h-3" />
                            Dr(a). {exame.medicos.nome}
                            {exame.medicos.especialidade && (
                              <span>— {exame.medicos.especialidade}</span>
                            )}
                          </p>
                        )}

                        {exame.observacoes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {exame.observacoes}
                          </p>
                        )}

                        {exame.arquivo_url && (
                          <a
                            href={exame.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 mt-2 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="w-3 h-3" />
                            Ver documento
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(exame.data_exame).getFullYear()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Laudos */}
        {activeView === "laudos" && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Relatórios e Laudos
            </h2>

            {relatoriosFiltrados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum laudo encontrado com os filtros atuais.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {relatoriosFiltrados.map((relatorio) => (
                  <Card 
                    key={relatorio.id} 
                    className="transition-all duration-200 hover:bg-accent/50 cursor-pointer border-transparent hover:border-emerald-500/30 shadow-sm hover:shadow-md"
                    onClick={() => router.push(`/relatorios/${relatorio.id}/editar`)}
                  >
                    <CardContent className="flex items-start gap-4 py-4">
                      {/* Data visual */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 shrink-0">
                        <Calendar className="w-4 h-4 text-emerald-500 mb-0.5" />
                        <span className="text-[10px] text-emerald-600 font-medium" suppressHydrationWarning>
                          {new Date(relatorio.data_relatorio).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {relatorio.titulo}
                          </span>
                        </div>

                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Stethoscope className="w-3 h-3" />
                          {relatorio.medicos?.nome ? (
                            `Dr(a). ${relatorio.medicos.nome} ${relatorio.medicos.especialidade ? `— ${relatorio.medicos.especialidade}` : ""}`
                          ) : relatorio.local_atendimento ? (
                            relatorio.local_atendimento
                          ) : (
                            "Não informado"
                          )}
                        </p>

                        {relatorio.observacoes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {relatorio.observacoes}
                          </p>
                        )}

                        {relatorio.arquivo_url && (
                          <a
                            href={relatorio.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-600 mt-2 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="w-3 h-3" />
                            Ver documento
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(relatorio.data_relatorio).getFullYear()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
