import { Suspense } from "react";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";

import PlayersTable from "./PlayersTable";

export default async function PlayersPage() {
  const players = await getPlayers();
  const playerNameOptions = getPlayerNameOptions(players as any);

  const events = await getPlayerEvents();

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-3 pb-6">
      <section className="max-w-7xl mx-auto">
        <SiteHeader
          subtitle="台灣旅外球員追蹤系統"
          showSearch
          playerNameOptions={playerNameOptions as any}
        />

        <div className="mb-6">
          <h2 className="text-3xl font-bold">旅外球員總表</h2>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-300">
              載入球員資料中...
            </div>
          }
        >
          <PlayersTable players={players as any} events={events as any} />
        </Suspense>
      </section>
    </main>
  );
}