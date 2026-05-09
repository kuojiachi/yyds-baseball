import { Suspense } from "react";

import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";

import TodayTable from "./TodayTable";

function getTaiwanTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function TodayPage() {
  const todayDate = getTaiwanTodayDate();

  const reports = await getDailyReports();

  const todayPlayers = reports.filter((report: any) => {
    return (
      String(report.report_date).slice(0, 10) === todayDate &&
      String(report.result ?? "").trim() !== ""
    );
  });
  const players = await getPlayers();
  const playerNameOptions = getPlayerNameOptions(players as any);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="max-w-7xl mx-auto">
        <SiteHeader
          subtitle="台灣旅外球員追蹤系統"
          showSearch
          playerNameOptions={playerNameOptions as any}
        />

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-300">
              載入球員出賽紀錄中...
            </div>
          }
        >
          <TodayTable
            todayPlayers={todayPlayers as any}
            allReports={reports as any}
          />
        </Suspense>
      </section>
    </main>
  );
}