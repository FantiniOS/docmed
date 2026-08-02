"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Calendar,
  Save,
  Loader2,
  ArrowLeft,
  User,
  Stethoscope,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import {
  relatorioSchema,
  type RelatorioSchemaType,
} from "@/lib/validations/relatorio";
import type { Paciente, Medico } from "@/types/database";

interface RelatorioFormProps {
  pacientes: Paciente[];
  medicos: Medico[];
  initialData?: RelatorioSchemaType & { id?: string };
}

export function RelatorioForm({ pacientes, medicos, initialData }: RelatorioFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadingText, setUploadingText] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RelatorioSchemaType>({
    resolver: zodResolver(relatorioSchema),
    defaultValues: initialData || {
      paciente_id: "",
      medico_id: null,
      titulo: "",
      data_relatorio: "",
      arquivo_url: null,
      observacoes: null,
      local_atendimento: null,
    },
  });

  async function onSubmit(data: RelatorioSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let finalArquivoUrl = initialData?.arquivo_url || data.arquivo_url;

      if (file) {
        setUploadingText("Fazendo upload...");
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("relatorios")
          .upload(filePath, file);

        if (uploadError) {
          toast.add({ title: "Erro", description: "Falha ao enviar arquivo.", type: "error" });
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("relatorios")
          .getPublicUrl(filePath);

        finalArquivoUrl = publicUrlData.publicUrl;
      }

      data.arquivo_url = finalArquivoUrl;
      setUploadingText("");

      if (initialData?.id) {
        const { error } = await supabase.from("relatorios").update(data).eq("id", initialData.id);
        if (error) throw error;
        toast.add({ title: "Sucesso!", description: "Relatório atualizado.", type: "success" });
      } else {
        const { error } = await supabase.from("relatorios").insert([data]);
        if (error) throw error;
        toast.add({ title: "Sucesso!", description: "Relatório cadastrado.", type: "success" });
      }

      // Se veio de um paciente específico, podemos voltar para a página dele,
      // senão, volta para exames
      router.push(data.paciente_id ? `/exames/paciente/${data.paciente_id}` : `/exames`);
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || "Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link
        href={initialData?.paciente_id ? `/exames/paciente/${initialData.paciente_id}` : `/exames`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-500" />
          {initialData ? "Editar Relatório" : "Adicionar Relatório"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre laudos, atestados e outros documentos médicos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Dados Básicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Paciente */}
            <div className="space-y-2">
              <Label>
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="paciente_id"
                render={({ field }) => (
                  <div>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={!!errors.paciente_id}
                      >
                        <SelectValue placeholder="Selecione o paciente">
                          {field.value ? pacientes.find((f) => f.id === field.value)?.nome : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {pacientes.map((fam) => (
                          <SelectItem key={fam.id} value={fam.id}>
                            {fam.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.paciente_id && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.paciente_id.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Médico (Opcional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                Médico Solicitante (Opcional)
              </Label>
              <Controller
                control={control}
                name="medico_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o médico...">
                        {field.value && field.value !== "none" ? "Dr(a). " + medicos.find((m) => m.id === field.value)?.nome : "Nenhum / Não Cadastrado"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum / Não Cadastrado</SelectItem>
                      {medicos.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          Dr(a). {med.nome} {med.especialidade ? `- ${med.especialidade}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            {/* Local de Atendimento */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="local_atendimento">
                Local de Atendimento / Médico Avulso (Opcional)
              </Label>
              <Input
                id="local_atendimento"
                placeholder="Ex: Hospital Mater Dei, Clínica, ou Dr. João (Plantão)"
                aria-invalid={!!errors.local_atendimento}
                {...register("local_atendimento")}
              />
              {errors.local_atendimento && (
                <p className="text-xs text-destructive">{errors.local_atendimento.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Detalhes do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título do Relatório <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                placeholder="Ex: Laudo Neurológico, Atestado de 5 dias"
                aria-invalid={!!errors.titulo}
                {...register("titulo")}
              />
              {errors.titulo && (
                <p className="text-xs text-destructive">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_relatorio">
                <Calendar className="w-3.5 h-3.5 inline-block mr-1" />
                Data <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_relatorio"
                type="date"
                aria-invalid={!!errors.data_relatorio}
                {...register("data_relatorio")}
              />
              {errors.data_relatorio && (
                <p className="text-xs text-destructive">
                  {errors.data_relatorio.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="arquivo">
              <Upload className="w-3.5 h-3.5 inline-block mr-1" />
              Documento (PDF ou Imagem)
            </Label>
            <Input
              id="arquivo"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {initialData?.arquivo_url && !file && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Arquivo atual:{" "}
                <a 
                  href={initialData.arquivo_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-500 hover:underline"
                >
                  Ver documento
                </a>
                . Envie um novo arquivo para substituir.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Repouso recomendado, retorno em 30 dias..."
              className="min-h-20"
              {...register("observacoes")}
            />
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href={initialData?.paciente_id ? `/exames/paciente/${initialData.paciente_id}` : `/exames`}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {uploadingText ? uploadingText : isSubmitting ? "Salvando..." : "Salvar Relatório"}
        </Button>
      </div>
    </form>
  );
}
