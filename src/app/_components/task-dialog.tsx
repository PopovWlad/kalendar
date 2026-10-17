"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import type { CaseFile, ItemKind, TaskItem } from "@/lib/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: CaseFile[];
  initial?: TaskItem | null;
  defaultDate: string;
  onSave: (item: TaskItem) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_FORM = {
  kind: "event" as ItemKind,
  title: "",
  date: "",
  time: "",
  place: "",
  caseId: "none",
  notes: "",
  done: false,
};

export function TaskDialog({
  open,
  onOpenChange,
  cases,
  initial,
  defaultDate,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        kind: initial.kind,
        title: initial.title,
        date: initial.date,
        time: initial.time ?? "",
        place: initial.place ?? "",
        caseId: initial.caseId ?? "none",
        notes: initial.notes ?? "",
        done: initial.done,
      });
    } else {
      setForm({ ...EMPTY_FORM, date: defaultDate });
    }
  }, [open, initial, defaultDate]);

  const patch = (p: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (!form.date) {
      toast.error("Укажите дату");
      return;
    }
    const now = new Date().toISOString();
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      kind: form.kind,
      title: form.title.trim(),
      date: form.date,
      time: form.time || undefined,
      place: form.place.trim() || undefined,
      notes: form.notes.trim() || undefined,
      caseId: form.caseId === "none" ? null : form.caseId,
      done: form.done,
      doneAt: initial?.doneAt,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
    onOpenChange(false);
  };

  const kindBtn = (value: ItemKind, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => patch({ kind: value })}
      className={cn(
        "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        form.kind === value
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-accent"
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initial ? "Изменить" : "Новое"}: {form.kind === "task" ? "задание" : "событие"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            {kindBtn("event", "Событие")}
            {kindBtn("task", "Задание")}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-title">Название *</Label>
              <Input
                id="item-title"
                list={form.kind === "event" ? "title-presets" : undefined}
                placeholder={form.kind === "task" ? "Например, ознакомиться с материалами" : "Например, заседание в суде"}
                value={form.title}
                onChange={(e) => patch({ title: e.target.value === "Иное" ? "" : e.target.value })}
              />
              {form.kind === "event" ? (
                <datalist id="title-presets">
                  <option value="Судебное заседание" />
                  <option value="Следственное действие" />
                  <option value="Иное" />
                </datalist>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="item-date">Дата *</Label>
                <Input
                  id="item-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => patch({ date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-time">Время</Label>
                <Input
                  id="item-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => patch({ time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-place">Место</Label>
              <Input
                id="item-place"
                placeholder="Суд, СИЗО, следственный орган…"
                value={form.place}
                onChange={(e) => patch({ place: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Привязка к делу</Label>
              <Select value={form.caseId} onValueChange={(v) => patch({ caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите дело" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без дела (личное)</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.defender}
                      {c.caseNumber ? ` · дело ${c.caseNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-notes">Заметки</Label>
              <Textarea
                id="item-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="item-done"
                type="checkbox"
                checked={form.done}
                onChange={(e) => patch({ done: e.target.checked })}
                className="h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary"
              />
              <Label htmlFor="item-done" className="cursor-pointer text-sm font-normal">
                Выполнено
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            {initial && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> Удалить
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={submit}>Сохранить</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Удалить запись?"
        description="Задание или событие будет удалено безвозвратно."
        actionLabel="Удалить"
        destructive
        onAction={() => {
          if (initial && onDelete) onDelete(initial.id);
          setConfirmDelete(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
