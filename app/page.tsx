import Link from "next/link";

import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import { formatEventDate, getEventDisplay } from "@/src/utils/playerEvents";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function getRelatedPlayer(row: any) {
  return Array.isArray(row.players) ? row.players[0] : row.players;
}

function getPlayerName(row: any) {
  return text(row.name_zh || row.name || getRelatedPlayer(row)?.name_zh);
}

function getPlayerTeam(row: any) {
  const player = getRelatedPlayer(row);

  return text(
    row.team_name ||
      row.team ||
      row.teams?.name_zh ||
      row.teams?.name_en ||
      player?.team_name ||
      player?.teams?.name_zh ||
      player?.teams?.name_en
  );
}

function getPlayerLevel(row: any) {
  return text(row.level || getRelatedPlayer(row)?.level);
}

function getPlayerLeague(row: any) {
  return text(row.league || getRelatedPlayer(row)?.league);
}

function getRegion(player: any) {
  const league = text(player.league);

  if (league === "旅美" || league === "MLB" || league === "MiLB") return "美職";
  if (league === "旅日" || league === "NPB") return "日職";
  if (league === "旅韓" || league === "KBO") return "韓職";
  if (league === "台裔") return "台裔";

  return league || "未分類";
}

function countBy(items: any[], key: string) {
  return items.reduce((acc: Record<string, number>, item) => {
    const value = text(item[key]) || "未分類";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

const LEVEL_ORDER: Record<string, number> = {
  MLB: 1,
  "3A": 2,
  AAA: 2,
  "2A": 3,
  AA: 3,
  "A+": 4,
  "1A": 5,
  RK: 6,
  "日職一軍": 7,
  "日職二軍": 8,
  "韓職一軍": 9,
};

function levelRank(level: unknown) {
  return LEVEL_ORDER[text(level)] ?? 999;
}

function isTopTodayReport(report: any) {
  const level = getPlayerLevel(report).toUpperCase();
  const league = getPlayerLeague(report).toUpperCase();

  return (
    level === "MLB" ||
    level === "3A" ||
    level === "AAA" ||
    level === "2A" ||
    level === "AA" ||
    level === "日職一軍" ||
    level === "韓職一軍" ||
    league === "NPB" ||
    league === "KBO"
  );
}

function getStats(report: any) {
  if (report.result) return text(report.result);
  if (report.stats) return text(report.stats);
  return "-";
}

<button
  onClick={async () => {
    const res = await fetch("/api/import/daily", { method: "POST" });
    const data = await res.json();
    alert(data.success ? "匯入成功" : "匯入失敗");
    location.reload();
  }}
  className="bg-green-600 px-4 py-2 rounded"
>
  匯入今日資料
</button>

export default async function Home() {
  const players = await getPlayers();
  const reports = await getDailyReports();
  const events = await getPlayerEvents();

  const playerNameOptions = getPlayerNameOptions(players as any);

  const injuredPlayers = players
    .filter((player: any) => text(player.status).includes("傷"))
    .map((player: any) => ({
      id: `injury-${player.id}`,
      player_id: player.id,
      name_zh: player.name_zh,
      event_date: "",
      event_type: "injury",

      team_name:
        player.team_name ||
        player.teams?.name_zh ||
        player.teams?.name_en ||
        "-",

      level: player.level || "-",
      note: player.status,
      source: "players",
    }));

  const movedPlayers = [
    ...injuredPlayers,
    ...events.filter((event: any) => text(event.event_type) !== ""),
  ]
    .sort((a: any, b: any) => {
      return levelRank(a.level) - levelRank(b.level);
    })
    .slice(0, 10);

  const latestDate = reports[0]?.report_date;

  const topTodayReports = reports
    .filter(
      (r) =>
        r.report_date === latestDate &&
        isTopTodayReport(r) &&
        String(r.result ?? "").trim() !== ""
    )
    .sort((a, b) => {
      return levelRank(getPlayerLevel(a)) - levelRank(getPlayerLevel(b));
    });

  const totalPlayers = players.length;
  const todayPlayers = topTodayReports.length;

  const regionCounts = players.reduce((acc: Record<string, number>, player: any) => {
    const region = getRegion(player);
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});

  const levelCounts = countBy(players, "level");

  const regionOrder = ["美職", "日職", "韓職", "台裔", "其他", "未分類"];
  const levelOrder = [
    "MLB",
    "3A",
    "2A",
    "A+",
    "1A",
    "RK",
    "日職一軍",
    "日職二軍",
    "韓職一軍",
    "其他",
    "未分類",
  ];

  const regionEntries = Object.entries(regionCounts).sort(([a], [b]) => {
    const indexA = regionOrder.indexOf(a);
    const indexB = regionOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const levelEntries = Object.entries(levelCounts).sort(([a], [b]) => {
    const indexA = levelOrder.indexOf(a);
    const indexB = levelOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <section className="w-full max-w-7xl mx-auto">
        <SiteHeader
          subtitle="台灣旅外球員追蹤系統"
          showSearch
          playerNameOptions={playerNameOptions as any}
        />

        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="bg-slate-900 rounded-2xl h-32 border border-slate-800 hover:bg-slate-800/60 relative px-6 pt-4">
              <p className="text-slate-400 text-sm absolute top-4 left-6">
                異動狀態
              </p>
              <p className="text-4xl font-bold h-full flex items-center justify-center">
                {movedPlayers.length}
              </p>
            </div>

            <div
              className="bg-slate-900 rounded-2xl h-32 border border-slate-800 hover:bg-slate-800/60 relative px-6 pt-4"
            >
              <p className="text-slate-400 text-sm absolute top-4 left-6">
                今日出賽球員
              </p>
              <p className="text-4xl font-bold h-full flex items-center justify-center">
                {todayPlayers}
              </p>
            </div>

            <div
              className="bg-slate-900 rounded-2xl h-32 border border-slate-800 hover:bg-slate-800/60 relative px-6 pt-4"
            >
              <p className="text-slate-400 text-sm absolute top-4 left-6">
                旅外含台裔球員總數
              </p>
              <p className="text-4xl font-bold h-full flex items-center justify-center">
                {totalPlayers}
              </p>
            </div>
          </div>

          <div className="mt-[40px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">異動球員</h2>
              <p className="text-slate-400 text-sm mt-1">近一周升降</p>
            </div>

            <div className="max-h-[300px] overflow-auto">
              <table className="w-full min-w-[760px] text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-30 bg-slate-800 text-slate-300">
                  <tr>
                    <th className="sticky left-0 z-40 bg-slate-800 text-left p-3 w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-700">
                      球員
                    </th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">球隊</th>
                    <th className="text-left p-3 w-[80px] min-w-[80px]">層級</th>
                    <th className="text-left p-3">異動</th>
                    <th className="text-left p-3">狀態</th>
                  </tr>
                </thead>

                <tbody>
                  {movedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        目前尚無異動紀錄
                      </td>
                    </tr>
                  ) : (
                    movedPlayers.map((event: any, index: number) => {
                      const eventDisplay = getEventDisplay(event);
                      const playerName = text(event.name_zh);
                      const playerId = event.player_id

                      return (
                        <tr
                          key={`${event.id || playerName}-${index}`}
                          className="border-t border-slate-800 hover:bg-slate-800/60"
                        >
                          <td className="sticky left-0 z-10 bg-slate-900 p-3 text-left font-bold w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                            <Link
                              href={playerId?`/players/${playerId}`: "#"}
                              className="text-sky-300 hover:text-sky-200 hover:underline"
                            >
                              {playerName || "-"}
                            </Link>
                          </td>

                          <td className="p-3 text-left w-[140px] min-w-[140px]">
                            {event.source === "players"
                              ? event.team_name || "-"
                              : eventDisplay.team}
                          </td>

                          <td className="p-3 text-left w-[80px] min-w-[80px]">
                            {event.source === "players"
                              ? event.level || "-"
                              : eventDisplay.level}
                          </td>

                          <td className="p-3 text-left">
                            {eventDisplay.type === "movement" ? (
                              <span className={eventDisplay.colorClass}>
                                {eventDisplay.label}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          <td className="p-3 text-left">
                            {event.source === "players" ? (
                              <span className="text-rose-300">
                                {text(event.note) || "傷兵"}
                              </span>
                            ) : eventDisplay.type === "status" ? (
                              <span className={eventDisplay.colorClass}>
                                {eventDisplay.label}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">今日戰報｜2A 以上</h2>
              <p className="text-slate-400 text-sm mt-1">
                只顯示 MLB、NPB、KBO、3A、2A
              </p>
            </div>

            <div className="max-h-[300px] overflow-auto">
              <table className="w-full min-w-[620px] text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-30 bg-slate-800 text-slate-300">
                  <tr>
                    <th className="sticky left-0 z-40 bg-slate-800 text-left p-3 w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-700">
                      球員
                    </th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">球隊</th>
                    <th className="text-left p-3 w-[80px] min-w-[80px]">層級</th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">對手</th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">成績</th>
                  </tr>
                </thead>

                <tbody>
                  {topTodayReports.map((report: any, index: number) => (
                    <tr
                      key={`${report.id || getPlayerName(report)}-${index}`}
                      className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="sticky left-0 z-10 bg-slate-900 p-3 text-left font-bold w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                        <Link
                          href={report.player_id || getRelatedPlayer(report)?.id ? `/players/${report.player_id || getRelatedPlayer(report)?.id}` : "#"}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {getPlayerName(report) || "-"}
                        </Link>
                      </td>
                      <td className="p-3 text-left w-[140px] min-w-[140px]">
                        {getPlayerTeam(report) || "-"}
                      </td>
                      <td className="p-3 text-left w-[80px] min-w-[80px]">
                        {getPlayerLevel(report) || "-"}
                      </td>
                      <td className="p-3 text-left whitespace-nowrap">
                        {text(report.opponent) || "-"}
                      </td>
                      <td className="p-3 text-left">{getStats(report) || "-"}</td>
                    </tr>
                  ))}

                  {topTodayReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        今日尚無 2A 以上戰報
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">美日韓職人數</h2>
              <p className="text-slate-400 text-sm mt-1">依旅外分類統計</p>
            </div>

            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-30 bg-slate-800 text-slate-300">
                  <tr>
                    <th className="text-left p-3">美日韓職</th>
                    <th className="text-left p-3">人數</th>
                    <th className="text-left p-3">佔比</th>
                  </tr>
                </thead>

                <tbody>
                  {regionEntries.map(([region, count]) => {
                    const percent =
                      totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;

                    return (
                      <tr
                        key={region}
                        className="border-t border-slate-800 hover:bg-slate-800/60"
                      >
                        <td className="p-3 text-left text-slate-200 font-medium">
                          {region}
                        </td>
                        <td className="p-3 text-left text-white font-bold">
                          {count} 人
                        </td>
                        <td className="p-3 text-left text-slate-300">
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="border-t border-slate-700 bg-slate-800/50">
                    <td className="p-3 text-left text-slate-100 font-bold">總數</td>
                    <td className="p-3 text-left text-white font-bold">
                      {totalPlayers} 人
                    </td>
                    <td className="p-3 text-left text-white font-bold">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">各層級人數</h2>
              <p className="text-slate-400 text-sm mt-1">依目前所屬層級統計</p>
            </div>

            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-30 bg-slate-800 text-slate-300">
                  <tr>
                    <th className="text-left p-3">各層級</th>
                    <th className="text-left p-3">人數</th>
                    <th className="text-left p-3">佔比</th>
                  </tr>
                </thead>

                <tbody>
                  {levelEntries.map(([level, count]) => {
                    const percent =
                      totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;

                    return (
                      <tr
                        key={level}
                        className="border-t border-slate-800 hover:bg-slate-800/60"
                      >
                        <td className="p-3 text-left text-slate-200 font-medium">
                          {level}
                        </td>
                        <td className="p-3 text-left text-white font-bold">
                          {count} 人
                        </td>
                        <td className="p-3 text-left text-slate-300">
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="border-t border-slate-700 bg-slate-800/50">
                    <td className="p-3 text-left text-slate-100 font-bold">總數</td>
                    <td className="p-3 text-left text-white font-bold">
                      {totalPlayers} 人
                    </td>
                    <td className="p-3 text-left text-white font-bold">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}