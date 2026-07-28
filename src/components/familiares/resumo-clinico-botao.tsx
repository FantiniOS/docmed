"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, FileDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { Familiar, ExameComRelacionamentos, RelatorioComRelacionamentos } from "@/types/database";
import jsPDF from "jspdf";
import { BodyMap } from "@/components/paciente/body-map";

interface ResumoClinicoSecaoProps {
  paciente: Familiar;
  exames: ExameComRelacionamentos[];
  evolucao: RelatorioComRelacionamentos[];
}

export function ResumoClinicoBotao({
  paciente,
  exames,
  evolucao,
}: ResumoClinicoSecaoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resumo, setResumo] = useState<string | null>(null);
  const [regioesAfetadas, setRegioesAfetadas] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente, exames, evolucao }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.details || errData?.error || "Erro ao gerar resumo clínico.");
      }

      const data = await res.json();
      setResumo(data.summary);
      setRegioesAfetadas(data.regioes_afetadas || []);
    } catch (error: any) {
      toast.add({ title: "Erro", description: error.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (resumo) {
      navigator.clipboard.writeText(resumo);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.add({ title: "Sucesso!", description: "Resumo copiado para a área de transferência.", type: "success" });
    }
  };

  const handleExportPDF = () => {
    if (!resumo) return;
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Resumo Clinico - ${paciente.nome}`, 10, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const textLines = doc.splitTextToSize(resumo, 180);
      doc.text(textLines, 10, 30);
      doc.save(`Resumo_${paciente.nome.replace(/\s+/g, '_')}.pdf`);
      toast.add({ title: "Sucesso!", description: "PDF baixado com sucesso.", type: "success" });
    } catch (error: any) {
      toast.add({ title: "Erro", description: "Falha ao gerar o PDF.", type: "error" });
    }
  };

  return (
    <Card className="border-emerald-500/20 shadow-sm bg-gradient-to-br from-slate-50 to-emerald-50/10 dark:from-zinc-950 dark:to-emerald-950/10 overflow-hidden">
      <CardHeader className="bg-white/50 dark:bg-zinc-900/50 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-lg">
              <Activity className="w-5 h-5" />
              Triagem & Mapeamento por IA
            </CardTitle>
            <CardDescription className="mt-1">
              Dossiê clínico inteligente gerado automaticamente através da análise do histórico do paciente.
            </CardDescription>
          </div>
          {!resumo && (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md transition-all shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? "Processando..." : "Gerar Mapeamento"}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {resumo && (
        <CardContent className="p-6">
          <div className="grid md:grid-cols-[1fr_300px] gap-8">
            <div className="flex flex-col gap-4">
              <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border shadow-sm flex-1">
                {resumo}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleExportPDF} className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700">
                  <FileDown className="w-4 h-4" />
                  Baixar PDF
                </Button>
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? "Copiado!" : "Copiar Texto"}
                </Button>
                <Button variant="ghost" onClick={handleGenerate} disabled={isLoading} className="gap-2 ml-auto text-muted-foreground">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 items-center">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 self-start w-full">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Mapa Corporal
              </h3>
              <BodyMap regioesAfetadas={regioesAfetadas} className="h-full min-h-[380px] bg-white dark:bg-zinc-900 shadow-sm" />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
