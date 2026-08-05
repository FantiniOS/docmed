"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocal } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RelatorioComRelacionamentos } from "@/types/database";

interface RelatorioTableProps {
  relatorios: RelatorioComRelacionamentos[];
}

export function RelatorioTable({ relatorios }: RelatorioTableProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!relatorios || relatorios.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground border rounded-lg bg-card/50">
        Nenhum relatório médico ou laudo cadastrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Título</TableHead>
            <TableHead>Médico/Local</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relatorios.map((relatorio) => (
            <TableRow key={relatorio.id}>
              <TableCell className="font-medium">{relatorio.titulo}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {relatorio.medicos?.nome ? (
                  `Dr(a). ${relatorio.medicos.nome}`
                ) : relatorio.local_atendimento ? (
                  relatorio.local_atendimento
                ) : (
                  "Não informado"
                )}
              </TableCell>
              <TableCell>
                {mounted ? (() => {
                  const dataStr = relatorio.data_relatorio.includes('T') ? relatorio.data_relatorio.substring(0, 16) : relatorio.data_relatorio;
                  const dateObj = parseLocal(dataStr);
                  const formatted = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                  const hasTime = dataStr.includes('T') && !dataStr.endsWith('T00:00') && !dataStr.endsWith('T12:00');
                  return hasTime ? `${formatted} às ${format(dateObj, "HH:mm")}` : formatted;
                })() : "..."}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  {relatorio.arquivo_url ? (
                    <a
                      href={relatorio.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                      title="Visualizar Arquivo"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-2 text-muted-foreground/20" title="Sem arquivo">
                      <Eye className="w-4 h-4" />
                    </div>
                  )}
                  
                  <Link
                    href={`/relatorios/${relatorio.id}/editar`}
                    className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  
                  <button
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
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
    </div>
  );
}
