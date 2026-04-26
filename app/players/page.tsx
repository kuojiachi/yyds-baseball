import { Suspense } from "react";

import SiteHeader from "@/src/components/SiteHeader";
import { getPlayersFromExcel } from "@/src/lib/excel";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";

import PlayersTable from "./PlayersTable";

export default async function PlayersPage() {
  const players = await getPlayersFromExcel();
  const playerNameOptions = getPlayerNameOptions(players);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <section className="max-w-7xl mx-auto">
        <SiteHeader
          subtitle="台灣旅外球員追蹤系統"
          showSearch
          playerNameOptions={playerNameOptions}
        />

        <div className="mb-6">
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