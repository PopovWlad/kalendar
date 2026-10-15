"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
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
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MapPin,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { deleteTask, saveTask, useAppData } from "@/lib/store";
import type { ItemKind, TaskItem } from "@/lib/types";
import { TaskDialog } from "./task-dialog";

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

type Filter = "all" | ItemKind;

export function CalendarPage() {
  const { cases, tasks } = useAppData();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskItem | null>(null);

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

  const byDate = useMemo(() => {
    const map = new Map<string, { undone: number; events: number; any: number }>();
    for (const t of tasks) {
      const entry = map.get(t.date) ?? { undone: 0, events: 0, any: 0 };
      entry.any += 1;
      if (t.kind === "event") entry.events += 1;
      if (!t.done) entry.undone += 1;
      map.set(t.date, entry);
    }
    return map;
  }, [tasks]);

  const dayItems = useMemo(() => {
    const items = tasks
      .filter((t) => t.date === selected)
      .filter((t) => filter === "all" || t.kind === filter)
      .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
    return items;
  }, [tasks, selected, filter]);

  const counters = byDate.get(selected);

  const toggleDone = (item: TaskItem) => {
    saveTask({
      ...item,
      done: !item.done,
      doneAt: !item.done ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    if (!item.done) toast.success(item.kind === "task" ? "Задание выполнено" : "Событие отмечено");
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: TaskItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Календарь месяца */}
      <section className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Предыдущий месяц"
            onClick={() => setCursor((m) => subMonths(m, 1))}
          >
            <ChevronLeft />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold capitalize">
              {format(cursor, "LLLL yyyy", { locale: ru })}
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
            aria-label="Следующий месяц"
            onClick={() => setCursor((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>

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
                    <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-gold" : "bg-gold")} />
                  ) : null}
                  {stats?.events ? (
                    <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-sky-500")} />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> задания
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> события
          </span>
        </div>
      </section>

      {/* Выбранный день */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold capitalize">
            {format(parseISO(selected), "d MMMM, EEEE", { locale: ru })}
          </h2>
          {counters ? (
            <span className="text-xs text-muted-foreground">
              всего: {counters.any}
              {counters.undone ? ` · не выполнено: ${counters.undone}` : ""}
            </span>
          ) : null}
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

        {dayItems.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            На этот день ничего нет.
            <br />
            Нажмите «+», чтобы добавить задание или событие.
          </div>
        ) : (
          <ul className="space-y-2">
            {dayItems.map((item) => {
              const linked = item.caseId ? caseById.get(item.caseId) : undefined;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm transition-opacity",
                    item.done && "opacity-60"
                  )}
                >
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={() => toggleDone(item)}
                    aria-label="Отметить выполненным"
                    className="mt-0.5 h-5 w-5"
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openEdit(item)}
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
                          {linked.caseNumber ? ` · № ${linked.caseNumber}` : ""}
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
            })}
          </ul>
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
