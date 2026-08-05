"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Calendar,
  Droplets,
  AlertTriangle,
  Heart,
  Pill,
  Save,
  Loader2,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
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
  familiarSchema,
  type FamiliarSchemaType,
  tiposSanguineos,
} from "@/lib/validations/familiar";

export function PacienteForm({ initialData }: { initialData?: FamiliarSchemaType & { id?: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.foto_url || null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FamiliarSchemaType>({
    resolver: zodResolver(familiarSchema),
    defaultValues: initialData ? {
      ...initialData,
      data_nascimento: initialData.data_nascimento.split('T')[0]
    } : {
      nome: "",
      data_nascimento: "",
      tipo_sanguineo: null,
      alergias: null,
      doencas_cronicas: null,
      medicamentos_uso_continuo: null,
      foto_url: null,
    },
  });

  async function onSubmit(data: FamiliarSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let fotoUrl = initialData?.foto_url || null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          console.error("Erro no upload do Supabase:", uploadError);
          throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
          
        fotoUrl = publicUrlData.publicUrl;
      }
      
      const payload = { 
        ...data, 
        foto_url: fotoUrl,
        data_nascimento: data.data_nascimento.includes('T') ? data.data_nascimento : `${data.data_nascimento}T12:00:00`
      };

      if (initialData?.id) {
        const { error } = await supabase.from("familiares").update(payload).eq("id", initialData.id);
        if (error) throw error;
        toast.add({ title: "Sucesso!", description: "Paciente atualizado.", type: "success" });
      } else {
        const { error } = await supabase.from("familiares").insert([payload]);
        if (error) throw error;
        toast.add({ title: "Sucesso!", description: "Paciente cadastrado.", type: "success" });
      }

      router.push("/pacientes");
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || "Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Back link */}
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Pacientes
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-500" />
          {initialData ? "Editar Paciente" : "Cadastrar Paciente"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados do membro da família.
        </p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
            <Avatar className="w-24 h-24 shadow-sm border border-border">
              <AvatarImage src={previewUrl || undefined} alt="Avatar" className="object-cover" />
              <AvatarFallback className="bg-emerald-500/10 text-emerald-500 text-xl font-medium">
                <Camera className="w-8 h-8 opacity-50" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <Label htmlFor="foto" className="cursor-pointer inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                <Camera className="w-4 h-4" />
                Escolher foto
              </Label>
              <Input 
                id="foto" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    setFile(selectedFile);
                    setPreviewUrl(URL.createObjectURL(selectedFile));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou GIF. Tamanho máximo de 5MB.
              </p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Maria da Silva"
              aria-invalid={!!errors.nome}
              {...register("nome")}
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          {/* Data de Nascimento + Tipo Sanguíneo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">
                <Calendar className="w-3.5 h-3.5" />
                Data de Nascimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_nascimento"
                type="date"
                aria-invalid={!!errors.data_nascimento}
                {...register("data_nascimento")}
              />
              {errors.data_nascimento && (
                <p className="text-xs text-destructive">
                  {errors.data_nascimento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                <Droplets className="w-3.5 h-3.5" />
                Tipo Sanguíneo
              </Label>
              <Controller
                control={control}
                name="tipo_sanguineo"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposSanguineos.map((tipo) => (
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
        </CardContent>
      </Card>

      {/* Informações Médicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Informações Médicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alergias */}
          <div className="space-y-2">
            <Label htmlFor="alergias">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Alergias
            </Label>
            <Textarea
              id="alergias"
              placeholder="Ex: Dipirona, Penicilina, Frutos do mar..."
              className="min-h-20"
              {...register("alergias")}
            />
            <p className="text-[11px] text-muted-foreground">
              Separe múltiplas alergias por vírgula.
            </p>
          </div>

          {/* Doenças Crônicas */}
          <div className="space-y-2">
            <Label htmlFor="doencas_cronicas">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Doenças Crônicas
            </Label>
            <Textarea
              id="doencas_cronicas"
              placeholder="Ex: Diabetes Tipo 2, Hipertensão..."
              className="min-h-20"
              {...register("doencas_cronicas")}
            />
          </div>

          {/* Medicamentos de Uso Contínuo */}
          <div className="space-y-2">
            <Label htmlFor="medicamentos_uso_continuo">
              <Pill className="w-3.5 h-3.5 text-blue-500" />
              Medicamentos de Uso Contínuo
            </Label>
            <Textarea
              id="medicamentos_uso_continuo"
              placeholder="Ex: Metformina 850mg (2x/dia), Losartana 50mg (1x/dia)..."
              className="min-h-20"
              {...register("medicamentos_uso_continuo")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {submitError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link
          href="/pacientes"
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
          {isSubmitting ? "Salvando..." : "Salvar Paciente"}
        </Button>
      </div>
    </form>
  );
}
