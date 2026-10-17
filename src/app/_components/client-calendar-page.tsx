"use client";

import dynamic from "next/dynamic";

export const ClientCalendarPage = dynamic(
  () => import("./calendar-page").then((m) => m.CalendarPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    ),
  }
);
