"use client";

import { useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { Briefcase, CalendarCheck2, CircleCheckBig, FileText, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/lib/store";

export function ReportPage() {
  const { cases, tasks } = useAppData();

  const stats = useMemo(() => {
    const active = cases.filter((c) => c.status === "active").length;
    const finished = cases.filter((c) => c.status === "finished").length;
    const doneItems = tasks.filter((t) => t.done).length;
    const upcoming = tasks.filter(
      (t) => !t.done && t.date >= format(new Date(), "yyyy-MM-dd")
    ).length;
    return { active, finished, doneItems, upcoming };
  }, [cases, tasks]);

  const periodLabel = format(startOfMonth(new Date()), "LLLL yyyy", { locale: ru });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold">Сводка по данным приложения</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" /> Дел в работе
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.active}</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Закончено дел
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.finished}</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleCheckBig className="h-3.5 w-3.5" /> Выполнено записей
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.doneItems}</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Предстоит
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats.upcoming}</div>
          </div>
        </div>
      </section>

      <section className="relative space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <span className="absolute right-3 top-3 rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
          бланк в разработке
        </span>
        <div>
          <h2 className="text-sm font-semibold">Отчетный бланк</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Период: <span className="capitalize">{periodLabel}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Отчетный период с</Label>
            <Input disabled placeholder="01.01.2025" />
          </div>
          <div className="space-y-1.5">
            <Label>по</Label>
            <Input disabled placeholder="31.01.2025" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>ФИО адвоката</Label>
          <Input disabled placeholder="Фамилия Имя Отчество" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Дел по назначению</Label>
            <Input disabled placeholder="—" />
          </div>
          <div className="space-y-1.5">
            <Label>Выездов / заседаний</Label>
            <Input disabled placeholder="—" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Примечания</Label>
          <Textarea disabled rows={4} placeholder="Здесь будет текст отчета…" />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Раздел готовится: отчет по ордерам за период, выборка по делам и
            выгрузка для печати. Данные об ордерах и заданиях уже собираются
            приложением — к выпуску отчета они подтянутся автоматически.
          </span>
        </div>
      </section>
    </div>
  );
}
