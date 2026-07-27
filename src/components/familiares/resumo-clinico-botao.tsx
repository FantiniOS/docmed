"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
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

      if (!res.ok) throw new Error("Erro ao gerar resumo clínico.");

      const data = await res.json();
      setResumo(data.summary);
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
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Sparkles className="w-5 h-5" />
              Resumo Clínico Gerado por IA
            </DialogTitle>
            <DialogDescription>
              Dossiê gerado automaticamente com base nos dados vitais, exames e evolução clínica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 p-5 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border shadow-sm">
            {resumo}
          </div>
          
          <div className="flex justify-end mt-4">
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
