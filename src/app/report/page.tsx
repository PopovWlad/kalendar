import type { Metadata } from "next";
import { ReportPage } from "./_components/report-page";

export const metadata: Metadata = {
  title: "Отчет — Ежедневник адвоката",
  description: "Отчетный бланк адвоката: данные по делам по назначению за период.",
};

export default function Report() {
  return <ReportPage />;
}
