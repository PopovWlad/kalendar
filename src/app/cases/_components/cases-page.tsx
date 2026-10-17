"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArchiveRestore,
  Gavel,
  Phone,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteCase, saveCase, useAppData } from "@/lib/store";
import type { CaseFile } from "@/lib/types";
import { CaseDialog } from "./case-dialog";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

export function CasesPage() {
  const { cases, tasks } = useAppData();
  const [showFinished, setShowFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CaseFile | null>(null);
  const [viewing, setViewing] = useState<CaseFile | null>(null);
  const [deleting, setDeleting] = useState<CaseFile | null>(null);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases
      .filter((c) => (showFinished ? c.status === "finished" : c.status === "active"))
      .filter((c) =>
        q
          ? [c.defender, c.category, c.article, c.caseNumber, c.orderNumber, c.authority]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [cases, showFinished, search]);

  const finishedCount = cases.filter((c) => c.status === "finished").length;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const finishCase = (c: CaseFile) => {
    saveCase({ ...c, status: "finished", finishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setViewing(null);
    toast.success("Дело помечено как «Закончено»");
  };

  const reopenCase = (c: CaseFile) => {
    saveCase({ ...c, status: "active", finishedAt: undefined, updatedAt: new Date().toISOString() });
    setViewing(null);
    toast.success("Дело возвращено в работу");
  };

  const removeCase = (c: CaseFile) => {
    deleteCase(c.id);
    setViewing(null);
    toast.success("Дело удалено. Связанные записи остались в календаре");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск: ФИО, статья, номер…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
          <ArchiveRestore className="h-4 w-4" />
          Законченные
          <Switch
            checked={showFinished}
            onCheckedChange={setShowFinished}
            aria-label="Показать законченные дела"
          />
        </label>
      </div>

      {showFinished && finishedCount === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Законченных дел пока нет
        </div>
      ) : null}

      {!showFinished && list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {search ? "Ничего не найдено" : "Дел пока нет. Нажмите «+», чтобы добавить первое дело по назначению"}
        </div>
      ) : null}

      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setViewing(c)}
              className="w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.defender}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[c.article, c.caseNumber && `дело № ${c.caseNumber}`, c.orderNumber && `ордер № ${c.orderNumber}`]
                      .filter(Boolean)
                      .join(" · ") || "данные не заполнены"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {c.category ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                      {c.category}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                    назначение
                  </span>
                </div>
              </div>
              {c.authority ? (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Gavel className="h-3 w-3" /> {c.authority}
                </div>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={openNew}
        aria-label="Добавить дело"
        className="fixed bottom-24 right-[max(1rem,calc(50%-21rem_+_1rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Просмотр дела */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.defender}</DialogTitle>
                <DialogDescription>
                  {viewing.status === "finished"
                    ? `Закончено${viewing.finishedAt ? ` · ${format(parseISO(viewing.finishedAt), "d MMMM yyyy", { locale: ru })}` : ""}`
                    : "Дело в работе"}
                </DialogDescription>
              </DialogHeader>

              <dl className="rounded-lg border p-3">
                <Row label="Категория" value={viewing.category} />
                <Row label="Статья" value={viewing.article} />
                <Row label="Номер дела" value={viewing.caseNumber} />
                <Row label="Ордер" value={[viewing.orderNumber, viewing.orderDate && format(parseISO(viewing.orderDate), "d MMMM yyyy", { locale: ru })].filter(Boolean).join(" от ")} />
                <Row label="Орган" value={viewing.authority} />
                <Row label="Следователь / судья" value={viewing.authorityWorker} />
                <Row label="Мера пресечения" value={viewing.measure} />
                <Row label="Телефон" value={viewing.phone} />
                <Row label="Тип" value="По назначению" />
              </dl>

              {viewing.notes ? (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{viewing.notes}</p>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Заданий и событий по делу: {tasks.filter((t) => t.caseId === viewing.id).length}
              </p>

              {viewing.phone ? (
                <Button variant="outline" asChild>
                  <a href={`tel:${viewing.phone.replace(/[^+\d]/g, "")}`}>
                    <Phone /> Позвонить подзащитному
                  </a>
                </Button>
              ) : null}

              <DialogFooter className="flex-row flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleting(viewing)}
                >
                  Удалить
                </Button>
                <div className="flex flex-1 justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(viewing);
                      setViewing(null);
                      setFormOpen(true);
                    }}
                  >
                    Изменить
                  </Button>
                  {viewing.status === "active" ? (
                    <Button variant="secondary" onClick={() => finishCase(viewing)}>
                      <ArchiveRestore /> Закончить
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => reopenCase(viewing)}>
                      <RotateCcw /> Вернуть в работу
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <CaseDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={(c) => {
          saveCase(c);
          setFormOpen(false);
          toast.success(editing ? "Изменения сохранены" : "Дело добавлено");
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Удалить дело${deleting ? ` — ${deleting.defender}` : ""}?`}
        description="Дело будет удалено с телефона. Задания и события по нему останутся в календаре без привязки."
        actionLabel="Удалить"
        destructive
        onAction={() => {
          if (deleting) removeCase(deleting);
          setDeleting(null);
        }}
      />
    </div>
  );
}
