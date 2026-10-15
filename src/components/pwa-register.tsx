"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let deferredPrompt: InstallPromptEvent | null = null;

export function consumeInstallPrompt(): InstallPromptEvent | null {
  const p = deferredPrompt;
  deferredPrompt = null;
  return p;
}

export function hasInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

export function PwaRegister() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as InstallPromptEvent;
      window.dispatchEvent(new Event("adv-install-available"));
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-gold px-4 py-1.5 text-xs font-medium text-gold-foreground">
      <WifiOff className="h-3.5 w-3.5" />
      Нет сети — приложение работает офлайн, данные сохраняются на телефоне
    </div>
  );
}
