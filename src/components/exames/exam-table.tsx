"use client";

import Link from "next/link";
import { Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export function ExamTable({ exames }: ExamTableProps) {
  if (!exames || exames.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card/50">
        Nenhum exame cadastrado para este familiar.
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
          {exames.map((exame) => (
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
                {format(new Date(exame.data_exame), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  {exame.arquivo_url ? (
                    <a
                      href={exame.arquivo_url}
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
                    href={`/exames/${exame.id}/editar`}
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
