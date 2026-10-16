"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let deferredPrompt: InstallPromptEvent | null = null;

// Версия в URL скрипта воркера гарантирует, что браузер возьмёт новый файл,
// даже если старый registration застрял в HTTP-кэше. Смена версии запускает
// самолечение: устаревший воркер снимается, кэши чистятся, страница
// перезагружается один раз — иначе превью показывает старый снапшот.
const SW_VERSION = "v2";
const SW_URL = `/sw.js?${SW_VERSION}`;

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
    if (!("serviceWorker" in navigator)) return;

    const healStaleWorker = async () => {
      const flag = `adv-sw-healed-${SW_VERSION}`;
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } finally {
        window.location.reload();
      }
    };

    navigator.serviceWorker
      .register(SW_URL)
      .then(() => {
        const controller = navigator.serviceWorker.controller;
        if (
          controller &&
          !controller.scriptURL.includes(`sw.js?${SW_VERSION}`)
        ) {
          void healStaleWorker();
        }
      })
      .catch(() => {});

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
