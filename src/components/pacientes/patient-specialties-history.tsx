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
        const unique = new Set<string>();
        data.forEach((c: any) => {
          const esp = c.especialidade || c.medicos?.especialidade;
          if (esp) {
            unique.add(esp);
          }
        });
        setEspecialidades(Array.from(unique).sort());
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
