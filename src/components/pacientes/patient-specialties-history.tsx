"use client";

import { useEffect, useState } from "react";
import { Stethoscope, History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PatientHistoryTimeline } from "@/components/consultas/patient-history-timeline";

export function PatientSpecialtiesHistory({ familiarId }: { familiarId: string }) {
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEspecialidades() {
      const { data } = await supabase
        .from("consultas")
        .select("especialidade, medicos(especialidade), data_consulta")
        .eq("familiar_id", familiarId)
        .lt("data_consulta", new Date().toISOString());

      if (data) {
        const checkSimilarRoot = (a: string, b: string) => {
          const normA = a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const normB = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (normA.includes(normB) || normB.includes(normA)) return true;
          const w1 = normA.split(/\s+/).filter(w => w.length > 4);
          const w2 = normB.split(/\s+/).filter(w => w.length > 4);
          for (const x of w1) {
            for (const y of w2) {
              if (x.substring(0, 5) === y.substring(0, 5)) return true;
            }
          }
          return false;
        };

        const grouped: string[] = [];
        data.forEach((c: any) => {
          const esp = c.especialidade || c.medicos?.especialidade;
          if (esp) {
            const existingIdx = grouped.findIndex(g => checkSimilarRoot(g, esp));
            if (existingIdx !== -1) {
              // Keep the longer / more complete name if possible (e.g. "Ginecologia e Obstetrícia" over "ginecilogia")
              if (esp.length > grouped[existingIdx].length) {
                grouped[existingIdx] = esp;
              }
            } else {
              grouped.push(esp);
            }
          }
        });
        setEspecialidades(grouped.sort());
      }
    }
    fetchEspecialidades();
  }, [familiarId]);

  if (especialidades.length === 0) return null;

  return (
    <div className="mb-6 bg-white dark:bg-zinc-950 p-4 rounded-xl border shadow-sm">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
        <History className="w-4 h-4" />
        Prontuário por Especialidade
      </h3>
      <div className="flex flex-wrap gap-2">
        {especialidades.map(esp => (
          <Badge 
            key={esp} 
            variant="secondary" 
            className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 transition-colors py-1.5 px-3"
            onClick={() => setSelectedEspecialidade(esp)}
          >
            <Stethoscope className="w-3 h-3 mr-1.5 opacity-70" />
            {esp}
          </Badge>
        ))}
      </div>

      <Sheet open={!!selectedEspecialidade} onOpenChange={(open) => !open && setSelectedEspecialidade(null)}>
        <SheetContent side="right" className="w-[90%] sm:max-w-md p-0 pt-10 border-l border-border bg-gray-50/50">
          <SheetHeader className="px-4 pb-4 border-b border-border bg-white dark:bg-zinc-950">
            <SheetTitle className="flex items-center gap-2 text-blue-600">
              <Stethoscope className="w-5 h-5" />
              {selectedEspecialidade}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-5rem)] p-4">
            <PatientHistoryTimeline
              familiarId={familiarId}
              especialidade={selectedEspecialidade}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
