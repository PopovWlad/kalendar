export const SCHEMA_VERSION = 1;

export type CaseKind = "appointment" | "agreement";
export type CaseStatus = "active" | "finished";

export interface CaseFile {
  id: string;
  kind: CaseKind;
  defender: string; // ФИО подзащитного
  category: string; // категория дела: Дознание / Следствие / Суд
  article: string; // статья УК / предмет дела
  caseNumber: string; // номер дела
  orderNumber: string; // номер ордера
  orderDate: string; // дата ордера, YYYY-MM-DD
  authority: string; // орган (следователь, суд и т.п.)
  authorityWorker: string; // ФИО следователя / судьи
  measure: string; // мера пресечения
  phone: string;
  notes: string;
  status: CaseStatus;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemKind = "task" | "event";

export interface TaskItem {
  id: string;
  kind: ItemKind; // task = Задание, event = Событие
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  place?: string;
  notes?: string;
  caseId?: string | null; // привязка к делу (null — личное, не по назначению)
  done: boolean;
  doneAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  schemaVersion: number;
  cases: CaseFile[];
  tasks: TaskItem[];
  savedAt?: string;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
