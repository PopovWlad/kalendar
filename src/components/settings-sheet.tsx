"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  Wifi,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  buildBackup,
  clearAll,
  replaceAll,
  useAppData,
} from "@/lib/store";
import type { AppData } from "@/lib/types";
import {
  consumeInstallPrompt,
  hasInstallPrompt,
} from "@/components/pwa-register";

const SYNC_ENDPOINT_KEY = "adv-sync-endpoint";
const REMINDER_KEY = "adv-backup-reminder";
const LAST_BACKUP_KEY = "adv-last-backup";
const APP_VERSION = "0.2.0";

function downloadBackup(data: AppData) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ezhednevnik-advokata-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  // Запоминаем дату последнего сохранения
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = useAppData();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [endpoint, setEndpoint] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [reminderOn, setReminderOn] = useState(true);

  useEffect(() => {
    setEndpoint(window.localStorage.getItem(SYNC_ENDPOINT_KEY) ?? "");
    setReminderOn(
      window.localStorage.getItem(REMINDER_KEY) !== "disabled"
    );
    setCanInstall(hasInstallPrompt());
    const onAvail = () => setCanInstall(true);
    window.addEventListener("adv-install-available", onAvail);
    return () => window.removeEventListener("adv-install-available", onAvail);
  }, []);

  const toggleReminder = useCallback((on: boolean) => {
    setReminderOn(on);
    window.localStorage.setItem(REMINDER_KEY, on ? "enabled" : "disabled");
    if (on) {
      toast.success("Напоминание включено");
    } else {
      toast.success("Напоминание отключено");
    }
  }, []);

  const saveEndpoint = (value: string) => {
    setEndpoint(value);
    window.localStorage.setItem(SYNC_ENDPOINT_KEY, value.trim());
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppData>;
      if (!Array.isArray(parsed.cases) || !Array.isArray(parsed.tasks)) {
        throw new Error("bad format");
      }
      replaceAll(parsed as AppData);
      toast.success(
        `Копия восстановлена: дел — ${parsed.cases.length}, заданий и событий — ${parsed.tasks.length}`
      );
    } catch {
      toast.error("Не удалось прочитать файл — это не резервная копия приложения");
    }
  };

  const testSync = async () => {
    if (!endpoint.trim()) {
      toast.error("Укажите адрес компьютера в сети Wi-Fi");
      return;
    }
    setSyncing(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${endpoint.trim().replace(/\/$/, "")}/api/sync`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("bad status");
      const body = (await res.json()) as { ok?: boolean; app?: string };
      if (!body.ok) throw new Error("bad body");
      toast.success("Связь есть — компьютер отвечает");
    } catch {
      toast.error("Компьютер не отвечает. Проверьте общий Wi-Fi и адрес");
    } finally {
      setSyncing(false);
    }
  };

  const sendBackup = async () => {
    if (!endpoint.trim()) {
      toast.error("Укажите адрес компьютера в сети Wi-Fi");
      return;
    }
    setSyncing(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${endpoint.trim().replace(/\/$/, "")}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBackup()),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("bad status");
      toast.success("Копия отправлена на компьютер");
    } catch {
      toast.error("Не удалось отправить. Проверьте связь и адрес");
    } finally {
      setSyncing(false);
    }
  };

  const install = async () => {
    const prompt = consumeInstallPrompt();
    if (!prompt) {
      toast.info("Меню браузера → «Установить приложение» / «Добавить на главный экран»");
      return;
    }
    await prompt.prompt();
    setCanInstall(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-6 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Настройки</SheetTitle>
          <SheetDescription>
            Данные хранятся в памяти телефона и работают без интернета
          </SheetDescription>
        </SheetHeader>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Резервная копия
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => downloadBackup(buildBackup())}>
              <Download /> Сохранить в файл
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> Восстановить
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportFile(file);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground">
            Сейчас в базе: дел — {data.cases.length}, заданий и событий — {data.tasks.length}.
            Файл копии можно сохранить на телефон или в облако.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-start gap-3">
              {reminderOn ? (
                <Bell className="mt-0.5 h-4 w-4 text-muted-foreground" />
              ) : (
                <BellOff className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Напоминать о резервной копии</p>
                <p className="text-xs text-muted-foreground">
                  Приложение будет напоминать раз в неделю
                </p>
              </div>
            </div>
            <Switch
              checked={reminderOn}
              onCheckedChange={toggleReminder}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Синхронизация по Wi-Fi (заготовка)
          </h3>
          <div className="space-y-2">
            <Label htmlFor="sync-endpoint">Адрес компьютера</Label>
            <Input
              id="sync-endpoint"
              placeholder="http://192.168.1.50:3000"
              inputMode="url"
              value={endpoint}
              onChange={(e) => saveEndpoint(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={syncing} onClick={() => void testSync()}>
              {syncing ? <Loader2 className="animate-spin" /> : <Wifi />} Проверить связь
            </Button>
            <Button variant="outline" disabled={syncing} onClick={() => void sendBackup()}>
              {syncing ? <Loader2 className="animate-spin" /> : <Download />} Отправить копию
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Обмен с будущим приложением на компьютере — по домашнему/офисному Wi-Fi,
            без интернета. Функция будет полностью включена после выхода десктоп-версии.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Приложение</h3>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setInfoOpen(true)}
          >
            <Info /> Важные сведения
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun /> : <Moon />} Светлая / тёмная
            </Button>
            {canInstall ? (
              <Button variant="outline" onClick={() => void install()}>
                <Smartphone /> Установить
              </Button>
            ) : (
              <Button variant="outline" onClick={() => void install()}>
                <CheckCircle2 /> Установить
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 /> Удалить все данные
          </Button>
        </section>

        <p className="mt-auto text-center text-xs text-muted-foreground">
          Ежедневник адвоката · версия {APP_VERSION} ·
          <br />
          дела по назначению; поддержка дел по соглашению и отчётов — в следующих версиях
        </p>

        <ConfirmDialog
          open={confirmClear}
          onOpenChange={setConfirmClear}
          title="Удалить все данные?"
          description="Будут удалены все дела, задания и события на этом телефоне. Сначала сохраните резервную копию в файл."
          actionLabel="Удалить всё"
          destructive
          onAction={() => {
            clearAll();
            setConfirmClear(false);
            toast.success("Все данные удалены");
          }}
        />

        <AlertDialog open={infoOpen} onOpenChange={setInfoOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-gold" />
                Важные сведения
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm leading-relaxed">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">1. Как можно потерять все данные</p>
                  <p className="text-muted-foreground">
                    Все ваши дела, задания и события хранятся только в памяти телефона и никуда
                    не отправляются. Если очистить данные браузера, удалить приложение с телефона
                    или сбросить настройки браузера — вся информация пропадёт навсегда.
                    Восстановить её будет невозможно.
                  </p>
                  <p className="text-muted-foreground">
                    Чтобы этого не случилось, в приложении предустановлено напоминание —
                    оно будет раз в неделю предлагать сохранить резервную копию.
                    Его можно отключить в Настройках: переключатель «Напоминать о резервной копии».
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
            <div className="flex justify-end">
              <Button variant="default" onClick={() => setInfoOpen(false)}>
                Понятно
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
