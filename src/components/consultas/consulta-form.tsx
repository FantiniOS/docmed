"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
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
  History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpeechTextarea } from "@/components/ui/speech-textarea";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { consultaSchema, type ConsultaSchemaType, tiposConsulta } from "@/lib/validations/consulta";
import { especialidades } from "@/lib/validations/medico";
import type { Familiar, Medico } from "@/types/database";
import { PatientHistoryTimeline } from "./patient-history-timeline";

interface ConsultaFormProps {
  familiares: Familiar[];
  medicos: Medico[];
  initialData?: ConsultaSchemaType & { id?: string };
  /** Data pré-preenchida vinda do calendário do Dashboard (formato datetime-local). */
  defaultDate?: string;
}

export function ConsultaForm({ familiares, medicos, initialData, defaultDate }: ConsultaFormProps) {
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
    defaultValues: initialData ? {
      ...initialData,
      data_consulta: initialData.data_consulta.substring(0, 16)
    } : {
      familiar_id: "",
      medico_id: "",
      data_consulta: defaultDate || "",
      motivo: null,
      diagnostico: null,
      prescricao: null,
      local_atendimento: null,
      especialidade: null,
      tipo_consulta: null,
    },
  });

  const selectedFamiliarId = useWatch({ control, name: "familiar_id" });
  const selectedMedicoId = useWatch({ control, name: "medico_id" });
  const selectedEspecialidade = useWatch({ control, name: "especialidade" });
  const isEditing = !!initialData?.id;

  async function onSubmit(data: ConsultaSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payloadLimpo = {
        familiar_id: data.familiar_id,
        medico_id: data.medico_id === "none" ? null : data.medico_id,
        data_consulta: data.data_consulta.substring(0, 16),
        motivo: data.motivo,
        diagnostico: data.diagnostico,
        prescricao: data.prescricao,
        local_atendimento: data.local_atendimento,
        especialidade: data.especialidade,
        tipo_consulta: data.tipo_consulta,
      };

      console.log('PAYLOAD DE CONSULTA ENVIADO:', JSON.stringify(payloadLimpo, null, 2));

      if (initialData?.id) {
        console.log('ID DA CONSULTA SENDO EDITADA:', initialData.id);
        const { data: updatedData, error } = await supabase.from("consultas").update(payloadLimpo).eq("id", initialData.id).select();
        if (error) {
          console.error('ERRO SUPABASE UPDATE:', error);
          toast.add({ title: "Erro ao salvar", description: error.message, type: "error" });
          setSubmitError(error.message);
          return;
        }
        if (!updatedData || updatedData.length === 0) {
          console.error('ALERTA RLS: A consulta não foi atualizada.');
          toast.add({ title: "Erro de Permissão (RLS)", description: "A alteração foi bloqueada.", type: "error" });
          setSubmitError("Bloqueado por RLS.");
          return;
        }
        toast.add({ title: "Sucesso!", description: "Consulta atualizada.", type: "success" });
      } else {
        const { data: insertedData, error } = await supabase.from("consultas").insert([payloadLimpo]).select();
        if (error) {
          console.error('ERRO SUPABASE INSERT:', error);
          toast.add({ title: "Erro ao salvar", description: error.message, type: "error" });
          setSubmitError(error.message);
          return;
        }
        if (!insertedData || insertedData.length === 0) {
          console.error('ALERTA RLS: A consulta não foi inserida.');
          toast.add({ title: "Erro de Permissão (RLS)", description: "A inserção foi bloqueada.", type: "error" });
          setSubmitError("Bloqueado por RLS.");
          return;
        }
        toast.add({ title: "Sucesso!", description: "Consulta agendada.", type: "success" });
      }

      window.location.href = "/consultas";
    } catch (err: any) {
      console.error('ERRO CATCH:', err);
      setSubmitError(err.message || "Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 items-start">
      {/* Coluna Esquerda: Formulário (ocupa 2 colunas no desktop) */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Link
            href="/consultas"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Consultas
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-blue-500" />
                {isEditing ? "Editar Consulta" : "Agendar Consulta"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Registre os dados da consulta médica.
              </p>
            </div>

            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="lg:hidden flex gap-2">
                    <History className="w-4 h-4" />
                    Histórico
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[90%] sm:max-w-md p-0 pt-10 border-l border-border bg-gray-50/50">
                <SheetHeader className="px-4 sr-only">
                  <SheetTitle>Histórico do Paciente</SheetTitle>
                </SheetHeader>
                <PatientHistoryTimeline
                  familiarId={selectedFamiliarId}
                  currentConsultaId={initialData?.id}
                  medicoId={selectedMedicoId === "none" ? null : selectedMedicoId}
                  especialidade={selectedEspecialidade}
                />
              </SheetContent>
            </Sheet>
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
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="familiar_id"
                render={({ field }) => (
                  <div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.familiar_id}>
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

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                Médico Solicitante (Opcional)
              </Label>
              <Controller
                control={control}
                name="medico_id"
                render={({ field }) => (
                  <div>
                    <Select value={field.value ?? ""} onValueChange={(val) => field.onChange(val || null)}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.medico_id}>
                        <SelectValue placeholder="Selecione o médico">
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
                    {errors.medico_id && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.medico_id.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Controller
                control={control}
                name="especialidade"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a especialidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp} value={esp}>
                          {esp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
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
            <Clock className="w-4 h-4 text-blue-500" />
            Agendamento & Detalhes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
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
            <Label>Tipo de Consulta</Label>
            <Controller
              control={control}
              name="tipo_consulta"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(val) => field.onChange(val || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposConsulta.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="motivo">Motivo da Consulta (Detalhes opcionais)</Label>
            <Input
              id="motivo"
              placeholder="Ex: Dores de cabeça constantes, tosse persistente..."
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
            <Label htmlFor="diagnostico">Diagnóstico / Evolução</Label>
            <SpeechTextarea
              id="diagnostico"
              placeholder="Ex: Paciente relata melhora das dores de cabeça..."
              className="min-h-24"
              {...register("diagnostico")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prescricao">Prescrição Médica</Label>
            <SpeechTextarea
              id="prescricao"
              placeholder="Ex: Ibuprofeno 400mg se houver dor, manter rotina de sono."
              className="min-h-24"
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
            {isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Agendar Consulta")}
          </Button>
        </div>
      </form>
      </div>

      {/* Coluna Direita: Timeline de Histórico (Visível apenas em Desktop) */}
      <div className="hidden lg:block lg:col-span-1 sticky top-24 h-[calc(100vh-8rem)]">
        <PatientHistoryTimeline
          familiarId={selectedFamiliarId}
          currentConsultaId={initialData?.id}
          medicoId={selectedMedicoId === "none" ? null : selectedMedicoId}
          especialidade={selectedEspecialidade}
        />
      </div>
    </div>
  );
}
