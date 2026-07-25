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

  // Agrupar exames por Familiar
  const examesAgrupados = exames?.reduce((acc, exame) => {
    const familiar = exame.familiares?.nome || "Desconhecido";
    if (!acc[familiar]) {
      acc[familiar] = [];
    }
    acc[familiar].push(exame);
    return acc;
  }, {} as Record<string, typeof exames>);

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

      {!exames || exames.length === 0 ? (
        <div className="rounded-md border bg-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <FileText className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">Nenhum exame cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(examesAgrupados || {}) as [string, any[]][]).map(([familiar, listaExames]) => (
            <div key={familiar} className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-5 py-4 border-b flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-500 font-semibold text-sm">
                    {familiar.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-foreground">{familiar}</h3>
                <span className="ml-auto bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  {listaExames.length} {listaExames.length === 1 ? 'exame' : 'exames'}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Exame</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listaExames.map((exame) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
