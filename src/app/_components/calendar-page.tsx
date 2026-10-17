"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MapPin,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteTask, saveTask, useAppData } from "@/lib/store";
import type { CaseFile, ItemKind, TaskItem } from "@/lib/types";
import { TaskDialog } from "./task-dialog";

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

type Filter = "all" | ItemKind;

type DayStats = { undone: number; events: number; any: number };

function MiniMonth({
  month,
  byDate,
  selected,
  onPick,
  onOpenMonth,
}: {
  month: Date;
  byDate: Map<string, DayStats>;
  selected: string;
  onPick: (dateKey: string) => void;
  onOpenMonth: (month: Date) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className="rounded-lg border bg-background/50 p-2">
      <button
        type="button"
        onClick={() => onOpenMonth(month)}
        className="mb-1 block w-full text-center text-xs font-semibold capitalize hover:text-foreground"
      >
        {format(month, "LLLL", { locale: ru })}
      </button>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const stats = byDate.get(key);
          const isSelected = key === selected;
          const dim = !isSameMonth(day, month);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              aria-label={format(day, "d MMMM", { locale: ru })}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center pb-1 rounded-md text-[10px] transition-colors",
                dim && "text-muted-foreground/40",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "hover:bg-accent",
                isToday(day) && !isSelected && "ring-1 ring-inset ring-gold"
              )}
            >
              {day.getDate()}
              {stats?.any ? (
                <span className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5">
                  {stats.undone ? (
                    <span className="h-1 w-1 rounded-full bg-gold" />
                  ) : null}
                  {stats.events ? (
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-primary-foreground/70" : "bg-sky-500"
                      )}
                    />
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  linked,
  onEdit,
}: {
  item: TaskItem;
  linked?: CaseFile;
  onEdit: (item: TaskItem) => void;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm transition-opacity",
        item.done && "opacity-60"
      )}
    >
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onEdit(item)}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-sm font-medium",
              item.done && "line-through decoration-muted-foreground"
            )}
          >
            {item.title}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              item.kind === "task"
                ? "bg-gold/15 text-gold"
                : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
            )}
          >
            {item.kind === "task" ? (
              <ListChecks className="h-3 w-3" />
            ) : (
              <CalendarClock className="h-3 w-3" />
            )}
            {item.kind === "task" ? "задание" : "событие"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {item.time ? <span>{item.time}</span> : null}
          {item.place ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {item.place}
            </span>
          ) : null}
          {linked ? (
            <span className="truncate">
              Дело: {linked.defender}
              {linked.address ? ` · адрес: ${linked.address}` : ""}
            </span>
          ) : (
            <span>без дела</span>
          )}
        </div>
        {item.notes ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.notes}</p>
        ) : null}
      </button>
    </li>
  );
}

export function CalendarPage() {
  const { cases, tasks } = useAppData();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [view, setView] = useState<"month" | "year">("month");

  const activeCases = useMemo(() => cases.filter((c) => c.status === "active"), [cases]);
  const caseById = useMemo(
    () => new Map(cases.map((c) => [c.id, c])),
    [cases]
  );

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(parseISO(selected), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const yearMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => new Date(cursor.getFullYear(), i, 1)),
    [cursor]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, { undone: number; events: number; any: number }>();
    for (const t of tasks) {
      const entry = map.get(t.date) ?? { undone: 0, events: 0, any: 0 };
      entry.any += 1;
      if (t.kind === "event") entry.events += 1;
      if (t.kind === "task" && !t.done) entry.undone += 1;
      map.set(t.date, entry);
    }
    return map;
  }, [tasks]);

  const weekItems = useMemo(() => {
    const keys = new Set(weekDays.map((d) => format(d, "yyyy-MM-dd")));
    return tasks
      .filter((t) => keys.has(t.date))
      .filter((t) => filter === "all" || t.kind === filter)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
      );
  }, [tasks, weekDays, filter]);

  const weekGroups = useMemo(
    () =>
      weekDays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        return { day, key, items: weekItems.filter((t) => t.date === key) };
      }),
    [weekDays, weekItems]
  );

  const undoneCount = weekItems.filter((t) => !t.done).length;

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: TaskItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const openFromYear = (dateKey: string) => {
    setSelected(dateKey);
    setCursor(startOfMonth(parseISO(dateKey)));
    setView("month");
  };

  const openMonthFromYear = (month: Date) => {
    setCursor(startOfMonth(month));
    setView("month");
  };

  return (
    <div className="space-y-4">
      {/* Календарь: месяц / год */}
      <section className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label={view === "year" ? "Предыдущий год" : "Предыдущий месяц"}
            onClick={() =>
              view === "year"
                ? setCursor((m) => subYears(m, 1))
                : setCursor((m) => subMonths(m, 1))
            }
          >
            <ChevronLeft />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold capitalize">
              {view === "year"
                ? format(cursor, "yyyy", { locale: ru })
                : format(cursor, "LLLL yyyy", { locale: ru })}
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setCursor(startOfMonth(new Date()));
                setSelected(format(new Date(), "yyyy-MM-dd"));
              }}
            >
              сегодня
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={view === "year" ? "Следующий год" : "Следующий месяц"}
            onClick={() =>
              view === "year"
                ? setCursor((m) => addYears(m, 1))
                : setCursor((m) => addMonths(m, 1))
            }
          >
            <ChevronRight />
          </Button>
        </div>

        {view === "month" ? (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const stats = byDate.get(key);
                const isSelected = key === selected;
                const dim = !isSameMonth(day, cursor);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-start gap-0.5 rounded-lg py-1.5 text-sm transition-colors",
                      dim && "text-muted-foreground/50",
                      isSelected
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "hover:bg-accent",
                      isToday(day) && !isSelected && "ring-1 ring-inset ring-gold"
                    )}
                  >
                    <span>{day.getDate()}</span>
                    <span className="flex h-1.5 items-center gap-0.5">
                      {stats?.undone ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      ) : null}
                      {stats?.events ? (
                        <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-sky-500")} />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {yearMonths.map((m) => (
              <MiniMonth
                key={format(m, "yyyy-MM")}
                month={m}
                byDate={byDate}
                selected={selected}
                onPick={openFromYear}
                onOpenMonth={openMonthFromYear}
              />
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> задания
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> события
            </span>
          </div>
          <div
            className="flex rounded-lg border p-0.5"
            role="group"
            aria-label="Режим просмотра календаря"
          >
            <button
              type="button"
              onClick={() => setView("month")}
              aria-pressed={view === "month"}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors",
                view === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Месяц
            </button>
            <button
              type="button"
              onClick={() => setView("year")}
              aria-pressed={view === "year"}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors",
                view === "year"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Год
            </button>
          </div>
        </div>
      </section>

      {/* События и задания за выбранную неделю */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <h2 className="text-sm font-semibold capitalize">
            {format(weekDays[0], "d MMMM", { locale: ru })}
            {weekDays[0].getFullYear() !== weekDays[6].getFullYear()
              ? ` ${format(weekDays[0], "yyyy", { locale: ru })}`
              : ""} – {format(weekDays[6], "d MMMM yyyy", { locale: ru })}
          </h2>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            всего: {weekItems.length}
            {undoneCount ? ` · не выполнено: ${undoneCount}` : ""}
          </span>
        </div>

        <div className="flex gap-2">
          {(
            [
              ["all", "Все"],
              ["task", "Задания"],
              ["event", "События"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {weekItems.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            На эту неделю ничего нет.
            <br />
            Нажмите «+», чтобы добавить задание или событие.
          </div>
        ) : (
          <div className="space-y-4">
            {weekGroups
              .filter((group) => group.items.length > 0)
              .map(({ day, key, items }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        isToday(day) ? "text-gold" : "text-muted-foreground"
                      )}
                    >
                      {format(day, "EEEEEE, d MMMM", { locale: ru })}
                    </h3>
                    {isToday(day) ? (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                        сегодня
                      </span>
                    ) : null}
                  </div>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        linked={item.caseId ? caseById.get(item.caseId) : undefined}
                        onEdit={openEdit}
                      />
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Кнопка добавления */}
      <button
        type="button"
        onClick={openNew}
        aria-label="Добавить задание или событие"
        className="fixed bottom-24 right-[max(1rem,calc(50%-21rem_+_1rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cases={activeCases}
        initial={editing}
        defaultDate={selected}
        onSave={(item) => {
          saveTask(item);
          setDialogOpen(false);
          toast.success(editing ? "Изменения сохранены" : "Добавлено");
        }}
        onDelete={(id) => {
          deleteTask(id);
          toast.success("Удалено");
        }}
      />
    </div>
  );
}
