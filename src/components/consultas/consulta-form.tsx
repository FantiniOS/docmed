"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarCheck,
  Save,
  Loader2,
  ArrowLeft,
  User,
  Stethoscope,
  Clock,
  FileText,
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
import { consultaSchema, type ConsultaSchemaType } from "@/lib/validations/consulta";
import type { Familiar, Medico } from "@/types/database";

interface ConsultaFormProps {
  familiares: Familiar[];
  medicos: Medico[];
  initialData?: ConsultaSchemaType & { id?: string };
}

export function ConsultaForm({ familiares, medicos, initialData }: ConsultaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ConsultaSchemaType>({
    resolver: zodResolver(consultaSchema),
    defaultValues: initialData || {
      familiar_id: "",
      medico_id: "",
      data_consulta: "",
      motivo: null,
      diagnostico: null,
      prescricao: null,
    },
  });

  async function onSubmit(data: ConsultaSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (initialData?.id) {
        const { error } = await supabase.from("consultas").update(data).eq("id", initialData.id);
        if (error) throw error;
        toast.add({ title: "Sucesso!", description: "Consulta atualizada.", type: "success" });
      } else {
        const { error } = await supabase.from("consultas").insert([data]);
        if (error) throw error;
        toast.add({ title: "Sucesso!", description: "Consulta agendada.", type: "success" });
      }

      router.push("/consultas");
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
        href="/consultas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Consultas
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-blue-500" />
          {initialData ? "Editar Consulta" : "Agendar Consulta"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre os dados da consulta médica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Familiar <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="familiar_id"
                render={({ field }) => (
                  <div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.familiar_id}>
                        <SelectValue placeholder="Selecione o familiar">
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

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                Médico <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="medico_id"
                render={({ field }) => (
                  <div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.medico_id}>
                        <SelectValue placeholder="Selecione o médico">
                          {field.value ? "Dr(a). " + medicos.find((m) => m.id === field.value)?.nome : undefined}
                        </SelectValue>
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
                    {errors.medico_id && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.medico_id.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Agendamento & Detalhes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_consulta">
              Data e Hora <span className="text-destructive">*</span>
            </Label>
            <Input
              id="data_consulta"
              type="datetime-local"
              aria-invalid={!!errors.data_consulta}
              {...register("data_consulta")}
            />
            {errors.data_consulta && (
              <p className="text-xs text-destructive">
                {errors.data_consulta.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Consulta</Label>
            <Input
              id="motivo"
              placeholder="Ex: Retorno, Check-up anual, Dor de cabeça constante..."
              {...register("motivo")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Resultados (Preencher após a consulta)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <Textarea
              id="diagnostico"
              placeholder="Ex: Enxaqueca tensional"
              className="min-h-20"
              {...register("diagnostico")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prescricao">Prescrição Médica</Label>
            <Textarea
              id="prescricao"
              placeholder="Ex: Ibuprofeno 400mg se houver dor, manter rotina de sono."
              className="min-h-20"
              {...register("prescricao")}
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
          href="/consultas"
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting ? "Salvando..." : "Agendar Consulta"}
        </Button>
      </div>
    </form>
  );
}
