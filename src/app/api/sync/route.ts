import { NextResponse } from "next/server";

// Заготовка точки обмена данными для будущей связи с приложением на компьютере
// по локальной сети Wi-Fi (без интернета): http://<адрес-телефона>:3000/api/sync
// GET  — проверка связи и краткая сводка базы
// POST — приём полной резервной копии JSON от телефонного приложения

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "Ежедневник адвоката (мобильное)",
    endpoint: "sync",
    ready: false,
    message:
      "Точка обмена найдена. Обмен данными с десктоп-приложением будет включён в следующей версии.",
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const data = body as {
    schemaVersion?: number;
    cases?: unknown[];
    tasks?: unknown[];
  };

  if (!Array.isArray(data?.cases) || !Array.isArray(data?.tasks)) {
    return NextResponse.json({ ok: false, error: "bad payload" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    received: { cases: data.cases.length, tasks: data.tasks.length },
    message: "Копия принята (демо-режим). В десктоп-версии данные будут записаны в базу.",
  });
}
