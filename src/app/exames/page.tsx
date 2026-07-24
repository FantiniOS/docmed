import { FileText } from "lucide-react";

export default function ExamesPage() {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold tracking-tight">Exames</h1>
      </div>
      <p className="text-muted-foreground">
        Lista de exames registrados será exibida aqui.
      </p>
    </div>
  );
}
