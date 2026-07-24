import Link from "next/link";
import { FileText, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ExamesPage() {
  const supabase = await createServerSupabaseClient();

  // Query no Supabase fazendo JOIN com a tabela de familiares
  const { data: exames, error } = await supabase
    .from("exames")
    .select("*, familiares(nome)")
    .order("data_exame", { ascending: false });

  if (error) {
    console.error("Erro ao buscar exames:", error);
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Meus Exames</h1>
        </div>
        <Link
          href="/exames/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Exame
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exame</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!exames || exames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum exame cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              exames.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">{exame.nome_exame}</TableCell>
                  <TableCell>{exame.tipo_exame || "-"}</TableCell>
                  <TableCell>
                    {format(new Date(exame.data_exame), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{exame.familiares?.nome || "Desconhecido"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {exame.arquivo_url ? (
                        <a
                          href={exame.arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-emerald-500 transition-colors"
                          title="Visualizar Arquivo"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 text-muted-foreground/30" title="Sem arquivo">
                          <Eye className="w-4 h-4" />
                        </div>
                      )}
                      
                      <Link
                        href={`/exames/${exame.id}/editar`}
                        className="p-2 text-muted-foreground hover:text-blue-500 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      
                      <button
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
