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
  Link as LinkIcon,
  Upload,
  Sparkles,
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
  exameSchema,
  type ExameSchemaType,
  tiposExames,
} from "@/lib/validations/exame";
import type { Familiar, Medico } from "@/types/database";

interface ExameFormProps {
  familiares: Familiar[];
  medicos: Medico[];
  initialData?: ExameSchemaType & { id?: string };
  /** Data pré-preenchida vinda do calendário do Dashboard (formato date ou datetime-local). */
  defaultDate?: string;
}

export function ExameForm({ familiares, medicos, initialData, defaultDate }: ExameFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadingText, setUploadingText] = useState("");

  const [isExtracting, setIsExtracting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ExameSchemaType>({
    resolver: zodResolver(exameSchema),
    defaultValues: initialData ? {
      ...initialData,
      data_exame: initialData.data_exame 
        ? (initialData.data_exame.includes('T') 
            ? initialData.data_exame.substring(0, 16) 
            : `${initialData.data_exame}T12:00`) 
        : ""
    } : {
      familiar_id: "",
      medico_id: null,
      nome_exame: "",
      tipo_exame: null,
      data_exame: defaultDate || "",
      arquivo_url: null,
      observacoes: null,
      local_atendimento: null,
    },
  });

  async function onSubmit(data: ExameSchemaType) {
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
          .from("exames")
          .upload(filePath, file);

        if (uploadError) {
          toast.add({ title: "Erro", description: "Falha ao enviar arquivo.", type: "error" });
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("exames")
          .getPublicUrl(filePath);

        finalArquivoUrl = publicUrlData.publicUrl;
      }

      const payloadLimpo = {
        familiar_id: data.familiar_id,
        medico_id: data.medico_id === "none" ? null : data.medico_id,
        nome_exame: data.nome_exame,
        tipo_exame: data.tipo_exame,
        data_exame: data.data_exame.length === 10 ? `${data.data_exame}T12:00:00` : data.data_exame,
        arquivo_url: finalArquivoUrl,
        observacoes: data.observacoes,
        local_atendimento: data.local_atendimento,
      };

      console.log('PAYLOAD DE UPDATE/INSERT ENVIADO:', JSON.stringify(payloadLimpo, null, 2));

      if (initialData?.id) {
        console.log('ID DO EXAME SENDO EDITADO:', initialData.id);
        const { data: updatedData, error } = await supabase.from("exames").update(payloadLimpo).eq("id", initialData.id).select();
        if (error) {
          console.error('ERRO SUPABASE UPDATE:', error);
          toast.add({ title: "Erro ao salvar", description: error.message, type: "error" });
          setSubmitError(error.message);
          return;
        }
        if (!updatedData || updatedData.length === 0) {
          console.error('ALERTA RLS: O Supabase não atualizou a linha. Verifique as políticas de RLS (Row Level Security).');
          toast.add({ title: "Erro de Permissão (RLS)", description: "A alteração foi bloqueada pelo banco de dados.", type: "error" });
          setSubmitError("Bloqueado por RLS. Nenhuma linha foi afetada.");
          return;
        }
        toast.add({ title: "Sucesso!", description: "Exame atualizado.", type: "success" });
      } else {
        const { data: insertedData, error } = await supabase.from("exames").insert([payloadLimpo]).select();
        if (error) {
          console.error('ERRO SUPABASE INSERT:', error);
          toast.add({ title: "Erro ao salvar", description: error.message, type: "error" });
          setSubmitError(error.message);
          return;
        }
        if (!insertedData || insertedData.length === 0) {
          console.error('ALERTA RLS: O Supabase não inseriu a linha. Verifique as políticas de RLS.');
          toast.add({ title: "Erro de Permissão (RLS)", description: "A inserção foi bloqueada pelo banco de dados.", type: "error" });
          setSubmitError("Bloqueado por RLS. Nenhuma linha foi inserida.");
          return;
        }
        toast.add({ title: "Sucesso!", description: "Exame cadastrado.", type: "success" });
      }

      // Hard redirect to bust Next.js App Router aggressive client cache
      window.location.href = "/exames";
    } catch (err: any) {
      console.error('ERRO CATCH:', err);
      setSubmitError(err.message || "Erro inesperado ao salvar. Tente novamente.");
      toast.add({ title: "Erro inesperado", description: err.message || "Erro inesperado ao salvar", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAIExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const aiFile = e.target.files?.[0];
    if (!aiFile) return;

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", aiFile);

      const res = await fetch("/api/extract-exam", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Falha ao extrair dados do exame");
      }

      const data = await res.json();
      
      if (data.familiar_nome) {
        const lowerNomeIA = data.familiar_nome.toLowerCase();
        const matched = familiares.find(f => 
          f.nome.toLowerCase().includes(lowerNomeIA) || 
          lowerNomeIA.includes(f.nome.toLowerCase().split(' ')[0])
        );
        if (matched) {
          setValue("familiar_id", matched.id);
        }
      }

      if (data.nome_exame) setValue("nome_exame", data.nome_exame);
      if (data.tipo_exame) setValue("tipo_exame", data.tipo_exame);
      if (data.data_exame) setValue("data_exame", data.data_exame);
      if (data.observacoes) setValue("observacoes", data.observacoes);

      toast.add({ title: "Sucesso!", description: "Dados extraídos com sucesso pela IA.", type: "success" });
    } catch (err: any) {
      toast.add({ title: "Erro", description: err.message, type: "error" });
    } finally {
      setIsExtracting(false);
      // reset input value so the same file can be uploaded again if needed
      e.target.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link
        href="/exames"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Exames
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            {initialData ? "Editar Exame" : "Adicionar Exame"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre os resultados de exames da sua família.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            id="ai-upload"
            onChange={handleAIExtract}
          />
          <Label
            htmlFor="ai-upload"
            className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-sm font-medium cursor-pointer transition-colors ${
              isExtracting ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isExtracting ? "Analisando..." : "Preencher com IA"}
          </Label>
        </div>
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
                name="familiar_id"
                render={({ field }) => (
                  <div>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={!!errors.familiar_id}
                      >
                        <SelectValue placeholder="Selecione o paciente">
                          {field.value ? familiares.find((f) => f.id === field.value)?.nome : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {familiares.map((fam) => (
                          <SelectItem key={fam.id} value={fam.id}>
                            {fam.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.familiar_id && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.familiar_id.message}
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
                placeholder="Ex: Hospital Mater Dei, UPA, ou Dr. João (Plantão)"
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
            Detalhes do Exame
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_exame">
              Nome do Exame <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_exame"
              placeholder="Ex: Hemograma Completo"
              aria-invalid={!!errors.nome_exame}
              {...register("nome_exame")}
            />
            {errors.nome_exame && (
              <p className="text-xs text-destructive">{errors.nome_exame.message}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_exame">
                <Calendar className="w-3.5 h-3.5" />
                Data e Hora do Exame <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_exame"
                type="datetime-local"
                aria-invalid={!!errors.data_exame}
                {...register("data_exame")}
              />
              {errors.data_exame && (
                <p className="text-xs text-destructive">
                  {errors.data_exame.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Exame</Label>
              <Controller
                control={control}
                name="tipo_exame"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposExames.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="arquivo">
              <Upload className="w-3.5 h-3.5" />
              Arquivo do Exame (PDF ou Imagem)
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
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Exame de rotina, glicose levemente alterada..."
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
          href="/exames"
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
          {uploadingText ? uploadingText : isSubmitting ? "Salvando..." : "Salvar Exame"}
        </Button>
      </div>
    </form>
  );
}
