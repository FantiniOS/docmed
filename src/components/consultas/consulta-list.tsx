"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, User, Stethoscope, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
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

export function ConsultaList({ initialConsultas }: { initialConsultas: ConsultaComRelacionamentos[] }) {
  const [consultas, setConsultas] = useState<ConsultaComRelacionamentos[]>(initialConsultas);
  const [consultaToDelete, setConsultaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!consultaToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("consultas").delete().eq("id", consultaToDelete);
      if (error) throw error;
      
      setConsultas(prev => prev.filter(item => item.id !== consultaToDelete));
      toast.add({ title: "Sucesso", description: "Consulta excluída com sucesso.", type: "success" });
    } catch (err: any) {
      console.error("Erro ao excluir consulta:", err);
      toast.add({ title: "Erro", description: "Falha ao excluir consulta.", type: "error" });
    } finally {
      setIsDeleting(false);
      setConsultaToDelete(null);
    }
  };

  return (
    <>
      <div className="grid gap-2">
        {consultas.map((consulta) => {
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
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/consultas/${consulta.id}/editar`}
                          className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0 p-1.5 rounded-md"
                          title="Editar Consulta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button
                          onClick={() => setConsultaToDelete(consulta.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 p-1.5 rounded-md"
                          title="Excluir Consulta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      <Dialog open={!!consultaToDelete} onOpenChange={(open) => !open && setConsultaToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Consulta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConsultaToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
