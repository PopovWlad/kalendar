"use client";

import { useSyncExternalStore } from "react";
import {
  SCHEMA_VERSION,
  type AppData,
  type CaseFile,
  type TaskItem,
} from "./types";

const STORAGE_KEY = "adv-diary-v1";

const EMPTY: AppData = { schemaVersion: SCHEMA_VERSION, cases: [], tasks: [] };

let state: AppData = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): AppData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
      cases: Array.isArray(parsed.cases) ? parsed.cases : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const next = parse(window.localStorage.getItem(STORAGE_KEY));
  if (next) state = next;
}

function persist() {
  try {
    const withStamp: AppData = { ...state, savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withStamp));
  } catch {
    // переполнение хранилища игнорируем: данные остаются в памяти сессии
  }
}

function commit(next: AppData) {
  state = next;
  if (typeof window !== "undefined") persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    hydrated = true;
    const next = parse(e.newValue);
    if (next) {
      state = next;
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppData {
  return state;
}

function getServerSnapshot(): AppData {
  return EMPTY;
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function saveCase(input: CaseFile) {
  const exists = state.cases.some((c) => c.id === input.id);
  const cases = exists
    ? state.cases.map((c) => (c.id === input.id ? input : c))
    : [input, ...state.cases];
  commit({ ...state, cases });
}

export function deleteCase(id: string) {
  const cases = state.cases.filter((c) => c.id !== id);
  // отвязываем задания и события, чтобы не остались ссылками на удалённое дело
  const tasks = state.tasks.map((t) =>
    t.caseId === id ? { ...t, caseId: null, updatedAt: new Date().toISOString() } : t
  );
  commit({ ...state, cases, tasks });
}

export function saveTask(input: TaskItem) {
  const exists = state.tasks.some((t) => t.id === input.id);
  const tasks = exists
    ? state.tasks.map((t) => (t.id === input.id ? input : t))
    : [input, ...state.tasks];
  commit({ ...state, tasks });
}

export function deleteTask(id: string) {
  commit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
}

export function replaceAll(data: AppData) {
  commit({
    schemaVersion: SCHEMA_VERSION,
    cases: Array.isArray(data.cases) ? data.cases : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
  });
}

export function clearAll() {
  commit({ ...EMPTY });
}

export function buildBackup(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    cases: state.cases,
    tasks: state.tasks,
    savedAt: new Date().toISOString(),
  };
}
