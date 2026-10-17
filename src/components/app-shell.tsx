"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, CalendarDays, FileText, Scale, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsSheet } from "@/components/settings-sheet";

const TABS = [
  { href: "/", label: "Календарь", icon: CalendarDays },
  { href: "/cases", label: "Дела", icon: Briefcase },
  { href: "/report", label: "Отчет", icon: FileText },
];

const TITLES: Record<string, string> = {
  "/": "Календарь",
  "/cases": "Дела",
  "/report": "Отчет",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const title = TITLES[pathname] ?? "Ежедневник";

  // Напоминание о резервной копии раз в 7 дней
  useEffect(() => {
    const reminded = sessionStorage.getItem("adv-backup-reminded");
    if (reminded) return;
    const reminderOn = localStorage.getItem("adv-backup-reminder") !== "disabled";
    if (!reminderOn) return;
    const lastBackup = localStorage.getItem("adv-last-backup");
    if (lastBackup) {
      const daysSince = (Date.now() - new Date(lastBackup).getTime()) / 86_400_000;
      if (daysSince < 7) return;
    }
    sessionStorage.setItem("adv-backup-reminded", "1");
    // Небольшая задержка, чтобы не мешать первоначальной загрузке
    const timer = setTimeout(() => {
      toast("Не забудьте сохранить резервную копию", {
        description: "Откройте Настройки → «Сохранить в файл»",
        action: {
          label: "Настройки",
          onClick: () => setSettingsOpen(true),
        },
        duration: 10_000,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col border-x bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scale className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            Уголовные дела по назначению
          </p>
        </div>
        <button
          type="button"
          aria-label="Настройки"
          onClick={() => setSettingsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-2xl border-t bg-background/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="grid grid-cols-3">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-16 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
