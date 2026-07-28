"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { Familiar, ExameComRelacionamentos, RelatorioComRelacionamentos } from "@/types/database";
import jsPDF from "jspdf";
import { BodyMap } from "@/components/paciente/body-map";

interface ResumoClinicoBotaoProps {
  paciente: Familiar;
  exames: ExameComRelacionamentos[];
  evolucao: RelatorioComRelacionamentos[];
}

export function ResumoClinicoBotao({
  paciente,
  exames,
  evolucao,
}: ResumoClinicoBotaoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resumo, setResumo] = useState<string | null>(null);
  const [regioesAfetadas, setRegioesAfetadas] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(true);
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
      
      // Quebra o texto para não ultrapassar a margem (largura da página A4 é ~210mm, margens 10mm de cada lado = 190mm livres)
      const textLines = doc.splitTextToSize(resumo, 180);
      doc.text(textLines, 10, 30);
      
      const fileName = `Resumo_${paciente.nome.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
      toast.add({ title: "Sucesso!", description: "PDF baixado com sucesso.", type: "success" });
    } catch (error: any) {
      toast.add({ title: "Erro", description: "Falha ao gerar o PDF.", type: "error" });
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={isLoading}
        className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md transition-all"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isLoading ? "Gerando..." : "Gerar Resumo Clínico por IA"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Sparkles className="w-5 h-5" />
              Resumo Clínico Gerado por IA
            </DialogTitle>
            <DialogDescription>
              Dossiê gerado automaticamente com base nos dados vitais, exames e evolução clínica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            <div className="grid md:grid-cols-[1fr_260px] gap-6">
              {/* Left Column: Text Summary */}
              <div className="flex flex-col gap-4">
                <div className="p-5 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border shadow-sm h-full">
                  {resumo}
                </div>
              </div>

              {/* Right Column: Body Map */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Mapeamento Corporal
                </h3>
                <BodyMap regioesAfetadas={regioesAfetadas} className="h-full min-h-[380px]" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2 pt-4 border-t shrink-0">
            <Button variant="outline" onClick={handleExportPDF} className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {isCopied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
