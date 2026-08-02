"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  CalendarPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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

const WEEKDAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_LABELS_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Extrai a data local ignorando offsets (corrige fuso horário do BD e bugs de browser).
 */
function parseLocal(dataString: string): Date {
  if (!dataString) return new Date();
  
  // Extrai componentes ignorando qualquer fuso horário anexado (Z, +00:00)
  const match = dataString.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)?(\d{2})?:?(\d{2})?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 12; // 12h se não tiver hora
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    
    return new Date(year, month, day, hour, minute);
  }
  return new Date(dataString);
}

/**
 * Formata hora de uma string ISO.
 */
function getHora(dataString: string): string {
  const date = parseLocal(dataString);
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
 * Formata a data para o formato aceito pelo input datetime-local.
 */
function toDatetimeLocalValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'09:00");
}

/**
 * Calendário mensal interativo para o Dashboard.
 *
 * - Indicadores visuais (bolinhas) nos dias com consultas (azul) e exames (âmbar).
 * - Hover em dia com eventos → Tooltip com resumo rápido dos agendamentos.
 * - Clique em qualquer dia → Dialog de "Novo Agendamento" com data pré-preenchida.
 * - Navegação entre meses com botões < e >.
 * - Dia atual destacado com anel e animação pulse.
 */
export function DashboardCalendar({
  consultas,
  exames,
}: DashboardCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);

  // Construir mapa de eventos por dia para lookup O(1)
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();

    for (const c of consultas) {
      const date = parseLocal(c.data_consulta);
      const key = getDateKey(date);
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
      const date = parseLocal(e.data_exame);
      const key = getDateKey(date);
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

  // Clique em qualquer dia → abre dialog de novo agendamento
  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day);
    setNewBookingDialogOpen(true);
  }, []);

  // Abrir dialog de eventos existentes
  const handleViewEvents = useCallback(() => {
    setNewBookingDialogOpen(false);
    setEventsDialogOpen(true);
  }, []);

  // Navegar para formulário de nova consulta com data pré-preenchida
  const handleNewConsulta = useCallback(() => {
    if (!selectedDate) return;
    const dateParam = toDatetimeLocalValue(selectedDate);
    router.push(`/consultas/novo?data=${encodeURIComponent(dateParam)}`);
  }, [selectedDate, router]);

  // Navegar para formulário de novo exame com data pré-preenchida
  const handleNewExame = useCallback(() => {
    if (!selectedDate) return;
    const dateParam = toDatetimeLocalValue(selectedDate);
    router.push(`/exames/novo?data=${encodeURIComponent(dateParam)}`);
  }, [selectedDate, router]);

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
      <Card className="[--card-spacing:--spacing(1.5)] sm:[--card-spacing:--spacing(3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Agenda
          </CardTitle>

          {/* Navegação */}
          <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToday}
              className="text-[10px] sm:text-xs h-7 w-auto px-1.5 sm:px-2 text-muted-foreground hover:text-foreground"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <span
              className="text-[11px] sm:text-sm font-medium min-w-[75px] sm:min-w-[120px] text-center capitalize"
              suppressHydrationWarning
            >
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Container com scroll horizontal para mobile */}
          <div className="w-full overflow-x-auto pb-2">
          <div>
          {/* Header dos dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS_FULL.map((label, i) => (
              <div
                key={label}
                className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1 sm:py-1.5"
              >
                <span className="sm:hidden">{WEEKDAY_LABELS_SHORT[i]}</span>
                <span className="hidden sm:inline">{label}</span>
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
              const hasEvents = events.length > 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isSelected =
                selectedDate != null && isSameDay(day, selectedDate);

              const dayButton = (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative flex flex-col items-center justify-center
                    p-1 sm:p-2 min-h-[36px] sm:min-h-[44px] rounded-md sm:rounded-lg transition-all duration-150
                    cursor-pointer hover:bg-accent/60
                    ${
                      isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }
                    ${isSelected ? "bg-accent ring-1 ring-primary/30" : ""}
                    ${today ? "font-bold" : ""}
                  `}
                >
                  {/* Número do dia */}
                  <span
                    className={`
                      text-[11px] sm:text-sm leading-none z-10
                      ${
                        today
                          ? "flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground animate-pulse-soft"
                          : ""
                      }
                    `}
                    suppressHydrationWarning
                  >
                    {format(day, "d")}
                  </span>

                  {/* Indicadores de eventos */}
                  {(hasConsulta || hasExame) && (
                    <div className="flex items-center gap-px sm:gap-0.5 mt-0.5">
                      {hasConsulta && (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
                      )}
                      {hasExame && (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  )}
                </button>
              );

              // Se o dia tem eventos, envolve com Tooltip para hover
              if (hasEvents) {
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger render={dayButton} />
                    <TooltipContent
                      side="top"
                      className="max-w-[220px] p-0 bg-popover text-popover-foreground ring-1 ring-foreground/10"
                    >
                      <div className="p-2 space-y-1">
                        <p
                          className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                          suppressHydrationWarning
                        >
                          {format(day, "dd MMM", { locale: ptBR })} ·{" "}
                          {events.length} evento{events.length !== 1 ? "s" : ""}
                        </p>
                        {events.slice(0, 4).map((event) => (
                          <div
                            key={`${event.type}-${event.id}`}
                            className="flex flex-col text-xs leading-tight mb-2 border-l-2 pl-2 pb-1 border-border/50 last:mb-0 last:pb-0"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  event.type === "consulta"
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              <span className="font-bold truncate">
                                {event.paciente ? event.paciente.split(' ').slice(0, 2).join(' ') : "Familiar não informado"}
                              </span>
                              <span className="text-muted-foreground ml-auto text-[10px] shrink-0">
                                {event.hora}
                              </span>
                            </div>
                            <span className="text-muted-foreground truncate ml-3">
                              {event.type === 'consulta' ? (event.medico || event.title) : event.title}
                            </span>
                          </div>
                        ))}
                        {events.length > 4 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{events.length - 4} mais...
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return dayButton;
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                Consulta
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" />
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">Exame</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[7px] sm:text-[8px] text-primary-foreground font-bold">
                  {format(new Date(), "d")}
                </span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">Hoje</span>
            </div>
          </div>
          </div>{/* fecha min-w-[280px] */}
          </div>{/* fecha overflow-x-auto */}
        </CardContent>
      </Card>

      {/* ============================================================
         Dialog: Novo Agendamento (abre ao clicar em qualquer dia)
         ============================================================ */}
      <Dialog open={newBookingDialogOpen} onOpenChange={setNewBookingDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary" />
              Novo Agendamento
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {selectedDate &&
                format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {/* Eventos existentes nesse dia */}
            {selectedDayEvents.length > 0 && (
              <div className="p-2.5 rounded-lg bg-accent/50 border border-border/50 mb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Já agendado neste dia
                </p>
                <div className="space-y-1">
                  {selectedDayEvents.slice(0, 3).map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          event.type === "consulta"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="font-medium">{event.hora}</span>
                      <span className="text-muted-foreground truncate">
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {selectedDayEvents.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{selectedDayEvents.length - 3} mais
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleViewEvents}
                  className="mt-1.5 text-[11px] text-primary font-medium hover:underline underline-offset-2"
                >
                  Ver todos os detalhes →
                </button>
              </div>
            )}

            {/* Escolha: Consulta ou Exame */}
            <p className="text-xs text-muted-foreground font-medium">
              O que deseja agendar?
            </p>

            <button
              type="button"
              onClick={handleNewConsulta}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-blue-500/5 hover:border-blue-500/30 transition-all duration-200 group text-left"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <CalendarCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                  Consulta
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Agendar consulta médica
                </p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </button>

            <button
              type="button"
              onClick={handleNewExame}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-amber-500/5 hover:border-amber-500/30 transition-all duration-200 group text-left"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground group-hover:text-amber-600 transition-colors">
                  Exame
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Agendar exame médico
                </p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================
         Dialog: Detalhes dos eventos do dia
         ============================================================ */}
      <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
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
