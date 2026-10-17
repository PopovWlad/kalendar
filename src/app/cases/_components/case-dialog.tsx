"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import type { CaseFile, CaseKind } from "@/lib/types";

interface CaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CaseFile | null;
  onSave: (item: CaseFile) => void;
}

const EMPTY_FORM = {
  kind: "appointment" as CaseKind,
  defender: "",
  category: "",
  article: "",
  address: "",
  orderNumber: "",
  orderDate: "",
  authority: "",
  authorityWorker: "",
  measure: "",
  phone: "",
  notes: "",
};

/** Кнопка выбора контакта через Contact Picker API (Android Chrome). */
function PickContactButton({
  onPick,
}: {
  onPick: (name: string, tel: string) => void;
}) {
  const supported =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    "ContactsManager" in window;

  const handlePick = useCallback(async () => {
    try {
      const contacts = await (navigator.contacts as any).select(["name", "tel"], {
        multiple: false,
      });
      if (contacts?.length > 0) {
        const c = contacts[0];
        const name = c.name?.[0] ?? "";
        const tel = c.tel?.[0] ?? "";
        if (tel) onPick(name, tel);
        else toast.error("В выбранном контакте нет номера телефона");
      }
    } catch (e: any) {
      if (e?.name !== "NotAllowedError" && e?.name !== "AbortError") {
        toast.error("Не удалось открыть контакты");
      }
    }
  }, [onPick]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handlePick}
      title="Выбрать из контактов"
      className="shrink-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </Button>
  );
}

export function CaseDialog({ open, onOpenChange, initial, onSave }: CaseDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        kind: initial.kind,
        defender: initial.defender,
        category: initial.category,
        article: initial.article,
        address: initial.address,
        orderNumber: initial.orderNumber,
        orderDate: initial.orderDate,
        authority: initial.authority,
        authorityWorker: initial.authorityWorker,
        measure: initial.measure,
        phone: initial.phone,
        notes: initial.notes,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, initial]);

  const patch = (p: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    if (!form.defender.trim()) {
      toast.error("Укажите фамилию подзащитного");
      return;
    }
    const now = new Date().toISOString();
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      kind: form.kind,
      defender: form.defender.trim(),
      category: form.category,
      article: form.article.trim(),
      address: form.address,
      orderNumber: form.orderNumber.trim(),
      orderDate: form.orderDate,
      authority: form.authority.trim(),
      authorityWorker: form.authorityWorker.trim(),
      measure: form.measure.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
      status: initial?.status ?? "active",
      finishedAt: initial?.finishedAt,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
    onOpenChange(false);
  };

  const kindBtn = (value: CaseKind, label: string, hint?: string) => (
    <button
      key={value}
      type="button"
      disabled={value === "agreement"}
      onClick={() => patch({ kind: value })}
      className={cn(
        "flex-1 rounded-md border px-3 py-2 text-left transition-colors",
        form.kind === value
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-accent",
        value === "agreement" && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="block text-sm font-medium">{label}</span>
      {hint ? (
        <span
          className={cn(
            "block text-[11px]",
            form.kind === value ? "text-primary-foreground/70" : "text-muted-foreground/70"
          )}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Изменить дело" : "Новое дело"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          {kindBtn("appointment", "По назначению", "ордер, постановление")}
          {kindBtn("agreement", "По соглашению", "в разработке")}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case-defender">Подзащитный (ФИО) *</Label>
            <Input
              id="case-defender"
              placeholder="Иванов Иван Иванович"
              value={form.defender}
              onChange={(e) => patch({ defender: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="case-category">Категория дела</Label>
            <Select value={form.category} onValueChange={(v) => patch({ category: v })}>
              <SelectTrigger id="case-category">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Дознание">Дознание</SelectItem>
                <SelectItem value="Следствие">Следствие</SelectItem>
                <SelectItem value="Суд">Суд</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case-article">Статья УК</Label>
            <Input
              id="case-article"
              placeholder="ч. 2 ст. 158 УК РФ"
              value={form.article}
              onChange={(e) => patch({ article: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="case-order">Ордер №</Label>
              <Input
                id="case-order"
                placeholder="12/543"
                value={form.orderNumber}
                onChange={(e) => patch({ orderNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-order-date">Дата ордера</Label>
              <Input
                id="case-order-date"
                type="date"
                value={form.orderDate}
                onChange={(e) => patch({ orderDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="case-authority">Орган</Label>
              <Input
                id="case-authority"
                placeholder="СО ОМВД / районный суд"
                value={form.authority}
                onChange={(e) => patch({ authority: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-worker">Следователь / судья</Label>
              <Input
                id="case-worker"
                placeholder="ФИО"
                value={form.authorityWorker}
                onChange={(e) => patch({ authorityWorker: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case-address">Адрес / кабинет №</Label>
            <Input
              id="case-address"
              placeholder="ул. Ленина, д. 5, каб. 312"
              value={form.address}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="case-measure">Мера пресечения</Label>
              <Input
                id="case-measure"
                placeholder="подписка о невыезде"
                value={form.measure}
                onChange={(e) => patch({ measure: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-phone">Телефон</Label>
              <div className="flex gap-2">
                <Input
                  id="case-phone"
                  type="tel"
                  placeholder="+7 900 000-00-00"
                  value={form.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  className="flex-1"
                />
                <PickContactButton
                  onPick={(name, tel) => {
                    patch({ phone: tel });
                    if (!form.defender.trim() && name) {
                      patch({ defender: name });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case-notes">Примечания</Label>
            <Textarea
              id="case-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={submit}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
