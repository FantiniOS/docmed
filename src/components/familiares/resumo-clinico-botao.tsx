"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Loader2, Copy, Check, FileDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { Familiar, ExameComRelacionamentos, RelatorioComRelacionamentos } from "@/types/database";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

  const relatorioRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente, exames, evolucao }),
      });
      const data = await response.json();
      if (response.ok && data.summary) {
        setResumo(data.summary);
        setRegioesAfetadas(data.regioes_afetadas || []);
        toast.add({ title: "Triagem concluída", description: "O dossiê foi gerado com sucesso.", type: "success" });
      } else {
        toast.add({ title: "Erro", description: data.error || "Falha ao gerar resumo.", type: "error" });
      }
    } catch (error) {
      toast.add({ title: "Erro", description: "Ocorreu um erro ao conectar com o serviço.", type: "error" });
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (!resumo) return;
    navigator.clipboard.writeText(resumo);
    setIsCopied(true);
    toast.add({ title: "Copiado!", description: "Resumo copiado para a área de transferência.", type: "success" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!resumo || !relatorioRef.current) return;
    try {
      // Aplica classe temporária para forçar cores HEX puras (desativando oklch/lab)
      relatorioRef.current.classList.add("pdf-safe-colors");

      const canvas = await html2canvas(relatorioRef.current, { 
        scale: 2, 
        backgroundColor: "#ffffff", // Força fundo branco hexadecimal explícito
        logging: false,
        useCORS: true
      });
      
      // Remove a classe temporária para restaurar o visual na tela
      relatorioRef.current.classList.remove("pdf-safe-colors");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calcula a proporção da imagem para caber na página A4 (largura: 210mm, margens de 10mm)
      const pdfWidth = 190;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
      pdf.save(`dossie-clinico-${paciente.nome.replace(/\s+/g, '_')}.pdf`);
      toast.add({ title: "Sucesso!", description: "PDF baixado com sucesso.", type: "success" });
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast.add({ title: "Erro", description: "Falha ao gerar o PDF.", type: "error" });
    }
  };

  return (
    <Card className="border-emerald-500/20 shadow-sm bg-gradient-to-br from-slate-50 to-emerald-50/10 dark:from-zinc-950 dark:to-emerald-950/10 overflow-hidden">
      <div ref={relatorioRef} className="bg-inherit">
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
              </div>
  
              <div className="flex flex-col gap-3 items-center">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 self-start w-full">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Mapa Corporal
                </h3>
                <div id="body-map-container" className="w-full flex justify-center bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
                  <BodyMap regioesAfetadas={regioesAfetadas} className="h-full min-h-[380px] border-none shadow-none" />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </div>

      {resumo && (
        <div className="p-6 pt-0 border-t border-border/50 bg-white/30 dark:bg-zinc-900/30 flex gap-2 justify-start mt-4">
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
      )}
    </Card>
  );
}
