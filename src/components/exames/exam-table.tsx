"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocal } from "@/lib/utils";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExameComRelacionamentos } from "@/types/database";

interface ExamTableProps {
  exames: ExameComRelacionamentos[];
}

export function ExamTable({ exames: initialExames }: ExamTableProps) {
  const [mounted, setMounted] = useState(false);
  const [examesList, setExamesList] = useState<ExameComRelacionamentos[]>(initialExames);
  const [exameToDelete, setExameToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
    setExamesList(initialExames);
  }, [initialExames]);

  const handleDelete = async () => {
    if (!exameToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("exames").delete().eq("id", exameToDelete);
      if (error) throw error;
      
      setExamesList(prev => prev.filter(item => item.id !== exameToDelete));
      toast.add({ title: "Sucesso", description: "Exame excluído com sucesso.", type: "success" });
    } catch (err: any) {
      console.error("Erro ao excluir exame:", err);
      toast.add({ title: "Erro", description: "Falha ao excluir exame.", type: "error" });
    } finally {
      setIsDeleting(false);
      setExameToDelete(null);
    }
  };

  if (!examesList || examesList.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground border rounded-lg bg-card/50">
        Nenhum exame cadastrado para este paciente.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Exame</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Médico/Local</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examesList.map((exame) => (
            <TableRow key={exame.id}>
              <TableCell className="font-medium">{exame.nome_exame}</TableCell>
              <TableCell>
                {exame.tipo_exame ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                    {exame.tipo_exame}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {exame.medicos?.nome ? (
                  `Dr(a). ${exame.medicos.nome}`
                ) : exame.local_atendimento ? (
                  exame.local_atendimento
                ) : (
                  "Não informado"
                )}
              </TableCell>
              <TableCell>
                {mounted ? (() => {
                  const dataStr = exame.data_exame.includes('T') ? exame.data_exame.substring(0, 16) : exame.data_exame;
                  const dateObj = parseLocal(dataStr);
                  const formatted = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                  const hasTime = dataStr.includes('T') && !dataStr.endsWith('T00:00') && !dataStr.endsWith('T12:00');
                  return hasTime ? `${formatted} às ${format(dateObj, "HH:mm")}` : formatted;
                })() : "..."}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  {exame.arquivo_url ? (
                    <a
                      href={exame.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                      title="Visualizar Arquivo"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-1.5 text-muted-foreground/20" title="Sem arquivo">
                      <Eye className="w-4 h-4" />
                    </div>
                  )}
                  
                  <Link
                    href={`/exames/${exame.id}/editar`}
                    className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  
                  <button
                    onClick={() => setExameToDelete(exame.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!exameToDelete} onOpenChange={(open) => !open && setExameToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Exame</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setExameToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
