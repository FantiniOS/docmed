"use client";

import { FileText, Calendar, User, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import type { ExameComRelacionamentos } from "@/types/database";

interface RecentExamsProps {
  exames: ExameComRelacionamentos[];
}

/**
 * Formata data ISO para exibição curta (ex: "24/07/2026").
 */
function formatarData(dataString: string): string {
  const date = new Date(dataString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Retorna a cor do badge baseado no tipo de exame.
 */
function getTipoExameStyle(tipo: string | null): string {
  if (!tipo) return "bg-muted text-muted-foreground";
  const t = tipo.toLowerCase();
  if (t.includes("sangue") || t.includes("hemograma")) return "bg-red-500/10 text-red-400";
  if (t.includes("imagem") || t.includes("raio") || t.includes("tomografia")) return "bg-blue-500/10 text-blue-400";
  if (t.includes("urina") || t.includes("fezes")) return "bg-amber-500/10 text-amber-400";
  return "bg-violet-500/10 text-violet-400";
}

/**
 * Retorna o primeiro e o segundo nome (ex: Maria Clara)
 */
function formatarNome(nome: string): string {
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1]}`;
}

export function RecentExams({ exames }: RecentExamsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          Últimos Exames
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
            <Link href="/exames">Ver todos</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {exames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum exame registrado
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {exames.map((exame) => (
              <Link
                key={exame.id}
                href={`/exames/${exame.id}/editar`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-accent/50 group"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-amber-500 transition-colors">
                      {exame.nome_exame}
                    </span>
                    {exame.tipo_exame && (
                      <span
                        className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${getTipoExameStyle(
                          exame.tipo_exame
                        )}`}
                      >
                        {exame.tipo_exame}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {exame.familiares && (
                      <span className="flex items-center gap-1.5">
                        <Avatar className="w-4 h-4 border border-border">
                          <AvatarImage src={exame.familiares.foto_url || undefined} alt={exame.familiares.nome} className="object-cover" />
                          <AvatarFallback className="bg-amber-500/10 text-amber-500 text-[8px] font-medium">
                            {exame.familiares.nome[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {formatarNome(exame.familiares.nome)}
                      </span>
                    )}
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Calendar className="w-3 h-3" />
                      {formatarData(exame.data_exame)}
                    </span>
                  </div>
                </div>

                {/* View action - Evitar a âncora dentro da âncora usando objeto ou mudando a rota pelo NextRouter, mas como Link aninhado dá erro de hidratação, 
                mudamos o elemento para uma div que captura o click e abre em nova aba. */}
                {exame.arquivo_url && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(exame.arquivo_url!, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
