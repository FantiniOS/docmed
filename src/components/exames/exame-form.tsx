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
}

export function ExameForm({ familiares, medicos }: ExameFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExameSchemaType>({
    resolver: zodResolver(exameSchema),
    defaultValues: {
      familiar_id: "",
      medico_id: null,
      nome_exame: "",
      tipo_exame: null,
      data_exame: "",
      arquivo_url: null,
      observacoes: null,
    },
  });

  async function onSubmit(data: ExameSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from("exames").insert([data]);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      router.push("/exames");
      router.refresh();
    } catch {
      setSubmitError("Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-500" />
          Adicionar Exame
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre os resultados de exames da sua família.
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
            {/* Familiar */}
            <div className="space-y-2">
              <Label>
                Familiar <span className="text-destructive">*</span>
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
                        <SelectValue placeholder="Selecione o familiar" />
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
                Médico Solicitante
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
                      <SelectValue placeholder="Opcional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medicos.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum médico cadastrado
                        </div>
                      ) : (
                        medicos.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            Dr(a). {med.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
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
                Data do Exame <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_exame"
                type="date"
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
            <Label htmlFor="arquivo_url">
              <LinkIcon className="w-3.5 h-3.5" />
              Link do Arquivo (PDF ou Imagem)
            </Label>
            <Input
              id="arquivo_url"
              type="url"
              placeholder="https://..."
              aria-invalid={!!errors.arquivo_url}
              {...register("arquivo_url")}
            />
            {errors.arquivo_url && (
              <p className="text-xs text-destructive">
                {errors.arquivo_url.message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Cole o link do laudo do exame. (O recurso de upload direto de arquivos será adicionado em breve).
            </p>
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
          {isSubmitting ? "Salvando..." : "Salvar Exame"}
        </Button>
      </div>
    </form>
  );
}
