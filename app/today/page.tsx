import { Suspense } from "react";
import { getTodayReportsFromExcel } from "@/src/lib/excel";
import Link from "next/link";
import TodayTable from "./TodayTable";

export default async function TodayPage() {
  const todayPlayers = await getTodayReportsFromExcel();

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <section className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold mb-2 hover:text-sky-300 transition">
              TWDS
            </h1>
          </Link>

          <p className="text-slate-400 mb-6">
            台灣旅外球員追蹤系統
          </p>

          <h2 className="text-3xl font-bold mb-2">今日出賽名單</h2>
          <p className="text-slate-300">
            今日出賽球員總數：{todayPlayers.length}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-300">
              載入今日出賽資料中...
            </div>
          }
        >
          <TodayTable todayPlayers={todayPlayers} />
        </Suspense>
      </section>
    </main>
  );
}