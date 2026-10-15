import type { Metadata } from "next";
import { CasesPage } from "./_components/cases-page";

export const metadata: Metadata = {
  title: "Дела — Ежедневник адвоката",
  description: "Учёт уголовных дел по назначению: подзащитные, ордера, органы следствия.",
};

export default function Cases() {
  return <CasesPage />;
}
