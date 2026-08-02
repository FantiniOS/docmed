"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarCheck,
  FileText,
  Clock,
  User,
  Stethoscope,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  ConsultaComRelacionamentos,
  ExameComRelacionamentos,
} from "@/types/database";

interface DashboardCalendarProps {
  consultas: ConsultaComRelacionamentos[];
  exames: ExameComRelacionamentos[];
}

type DayEvent = {
  type: "consulta" | "exame";
  id: string;
  title: string;
  hora: string;
  medico: string | null;
  especialidade: string | null;
  local: string | null;
  paciente: string | null;
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Formata hora de uma string ISO.
 */
function getHora(dataString: string): string {
  const date = new Date(dataString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Retorna a chave de data no formato YYYY-MM-DD para lookup rápido.
 */
function getDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Calendário mensal interativo para o Dashboard.
 *
 * - Exibe indicadores visuais (bolinhas) nos dias com consultas (azul) e exames (âmbar).
 * - Ao clicar em um dia com eventos, abre um dialog com o resumo dos agendamentos.
 * - Navegação entre meses com botões < e >.
 * - Dia atual destacado com anel e animação pulse.
 */
export function DashboardCalendar({
  consultas,
  exames,
}: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Construir mapa de eventos por dia para lookup O(1)
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();

    for (const c of consultas) {
      const key = getDateKey(new Date(c.data_consulta));
      const event: DayEvent = {
        type: "consulta",
        id: c.id,
        title: c.motivo || "Consulta médica",
        hora: getHora(c.data_consulta),
        medico: c.medicos ? `Dr(a). ${c.medicos.nome}` : null,
        especialidade:
          c.medicos?.especialidade || c.especialidade || null,
        local: c.local_atendimento || null,
        paciente: c.familiares?.nome || null,
      };
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }

    for (const e of exames) {
      const key = getDateKey(new Date(e.data_exame));
      const event: DayEvent = {
        type: "exame",
        id: e.id,
        title: e.nome_exame,
        hora: getHora(e.data_exame),
        medico: e.medicos ? `Dr(a). ${e.medicos.nome}` : null,
        especialidade: e.medicos?.especialidade || null,
        local: e.local_atendimento || null,
        paciente: e.familiares?.nome || null,
      };
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }

    return map;
  }, [consultas, exames]);

  // Gerar dias do calendário (inclui dias do mês anterior e próximo para completar a grade)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Eventos do dia selecionado
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDay.get(getDateKey(selectedDate)) || [];
  }, [selectedDate, eventsByDay]);

  function handleDayClick(day: Date) {
    const key = getDateKey(day);
    const events = eventsByDay.get(key);
    if (events && events.length > 0) {
      setSelectedDate(day);
      setDialogOpen(true);
    }
  }

  function handlePrevMonth() {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }

  function handleToday() {
    setCurrentMonth(new Date());
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Agenda
          </CardTitle>

          {/* Navegação */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToday}
              className="text-xs h-7 w-auto px-2 text-muted-foreground hover:text-foreground"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span
              className="text-sm font-medium min-w-[120px] text-center capitalize"
              suppressHydrationWarning
            >
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Header dos dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1.5"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = getDateKey(day);
              const events = eventsByDay.get(key) || [];
              const hasConsulta = events.some((e) => e.type === "consulta");
              const hasExame = events.some((e) => e.type === "exame");
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isSelected =
                selectedDate != null && isSameDay(day, selectedDate);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={events.length === 0}
                  className={`
                    relative flex flex-col items-center justify-center
                    py-2 sm:py-2.5 rounded-lg transition-all duration-150
                    ${
                      isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }
                    ${
                      events.length > 0
                        ? "cursor-pointer hover:bg-accent/60"
                        : "cursor-default"
                    }
                    ${isSelected ? "bg-accent ring-1 ring-primary/30" : ""}
                    ${today ? "font-bold" : ""}
                  `}
                >
                  {/* Número do dia */}
                  <span
                    className={`
                      text-xs sm:text-sm leading-none z-10
                      ${
                        today
                          ? "flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground animate-pulse-soft"
                          : ""
                      }
                    `}
                    suppressHydrationWarning
                  >
                    {format(day, "d")}
                  </span>

                  {/* Indicadores de eventos */}
                  {(hasConsulta || hasExame) && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {hasConsulta && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {hasExame && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">
                Consulta
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">Exame</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[8px] text-primary-foreground font-bold">
                  {format(new Date(), "d")}
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground">Hoje</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes do dia */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              {selectedDate &&
                format(selectedDate, "dd 'de' MMMM, EEEE", {
                  locale: ptBR,
                })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} evento
              {selectedDayEvents.length !== 1 ? "s" : ""} agendado
              {selectedDayEvents.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedDayEvents.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className={`
                  p-3 rounded-lg border-l-3
                  ${
                    event.type === "consulta"
                      ? "border-l-blue-500 bg-blue-500/5"
                      : "border-l-amber-500 bg-amber-500/5"
                  }
                `}
              >
                {/* Type badge + title */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-foreground leading-snug">
                    {event.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] h-5 ${
                      event.type === "consulta"
                        ? "text-blue-500 border-blue-500/30"
                        : "text-amber-500 border-amber-500/30"
                    }`}
                  >
                    {event.type === "consulta" ? (
                      <CalendarCheck className="w-3 h-3 mr-1" />
                    ) : (
                      <FileText className="w-3 h-3 mr-1" />
                    )}
                    {event.type === "consulta" ? "Consulta" : "Exame"}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{event.hora}</span>
                  </div>

                  {event.paciente && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 shrink-0" />
                      <span>{event.paciente}</span>
                    </div>
                  )}

                  {event.medico && (
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3 h-3 shrink-0" />
                      <span>
                        {event.medico}
                        {event.especialidade && (
                          <span className="text-muted-foreground/70">
                            {" "}
                            · {event.especialidade}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {event.local && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{event.local}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
