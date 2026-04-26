import { Suspense } from "react";
import { getPlayersFromExcel } from "@/src/lib/excel";
import Link from "next/link";
import PlayersTable from "./PlayersTable";

export default async function PlayersPage() {
  const players = await getPlayersFromExcel();

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

          <h2 className="text-3xl font-bold mb-2">旅外球員總表</h2>
          <p className="text-slate-300">總表球員數：{players.length}</p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-300">
              載入球員資料中...
            </div>
          }
        >
          <PlayersTable players={players} />
        </Suspense>
      </section>
    </main>
  );
}