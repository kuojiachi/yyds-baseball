import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import PlayerPageHeader from "../_components/PlayerPageHeader";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function displayValue(value: unknown) {
  const v = text(value);
  return v || "-";
}

function hasRealGameReport(report: any): boolean {
  return (
    Number(report.ab ?? 0) > 0 ||
    Number(report.h ?? 0) > 0 ||
    Number(report.rbi ?? 0) > 0 ||
    Number(report.ip ?? 0) > 0 ||
    Number(report.innings ?? 0) > 0 ||
    Number(report.pitches ?? 0) > 0 ||
    text(report.result) !== ""
  );
}

export default async function GamesPage({ params }: PageProps) {
  const routeParams = await params;
  const id = decodeURIComponent(routeParams.id || "");

  const players = (await getPlayers()) as any[];
  const reports = (await getDailyReports()) as any[];
  const playerNameOptions = getPlayerNameOptions(players as any);

  const player = players.find((p: any) => {
    return (
      String(p.id) === id ||
      String(p.name_zh) === id ||
      String(p.name_en) === id
    );
  }) as any;

  if (!player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
        <section className="w-full max-w-5xl mx-auto">
          <SiteHeader subtitle="出賽紀錄" showSearch playerNameOptions={playerNameOptions as any} />

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h1 className="text-3xl font-bold">找不到球員</h1>
            <p className="mt-2 text-slate-400">{id}</p>
          </div>
        </section>
      </main>
    );
  }

  const playerReports = reports
    .filter((report: any) => {
      return String(report.player_id) === String(player.id) && hasRealGameReport(report);
    })
    .sort((a: any, b: any) => {
      return new Date(b.report_date).getTime() - new Date(a.report_date).getTime();
    });

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="w-full max-w-5xl mx-auto">
        <SiteHeader subtitle="出賽紀錄" showSearch playerNameOptions={playerNameOptions as any} />

        <PlayerPageHeader player={player} showBackLink />

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-xl font-bold">出賽紀錄</h2>
            <p className="text-slate-400 text-sm mt-1">
              依日期由新到舊排序
            </p>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-4 px-5 py-3 border-b border-slate-800 text-sm text-slate-400">
            <div>日期</div>
            <div>成績</div>
          </div>

          {playerReports.length === 0 ? (
            <div className="p-5 text-slate-400">目前沒有出賽紀錄</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {playerReports.map((report: any) => (
                <div
                  key={report.id}
                  className="grid grid-cols-[120px_1fr] gap-4 p-5 items-center"
                >
                  <div className="text-sm text-slate-400">
                    {displayValue(report.report_date)}
                  </div>

                  <div className="text-lg font-bold text-white">
                    {displayValue(report.result || report.stats || "出賽")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}