import SiteHeader from "@/src/components/SiteHeader";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import {getPlayersFromExcel,getTodayReportsFromExcel,} from "@/src/lib/excel";
import { Suspense } from "react";
import TodayTable from "./TodayTable";

export default async function TodayPage() {
  const todayPlayers = await getTodayReportsFromExcel();
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
          <h2 className="text-3xl font-bold mb-2">今日出賽</h2>
          <p className="text-slate-300">今日戰報數：{todayPlayers.length}</p>
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