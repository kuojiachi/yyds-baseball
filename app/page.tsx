import SiteHeader from "@/src/components/SiteHeader";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import Link from "next/link";
import { getPlayersFromExcel, getTodayReportsFromExcel } from "@/src/lib/excel";
import { getMovementClass, getStatusClass } from "@/src/utils/playerStyles";

export default async function Home() {
  const players = await getPlayersFromExcel();
  const todayReports = await getTodayReportsFromExcel();
  const playerNameOptions = getPlayerNameOptions(players);

  const movedPlayers = players.filter((player) => {
    const movement = String(player.movement || "").trim();
    const statusChange = String(player.note || "").trim();
    const status = String(player.status || "").trim();
    const statusLabel = String(player.statusLabel || "").trim();

    const hasMovement = movement !== "" && movement !== "-";
    const hasStatusChange = statusChange !== "" && statusChange !== "-";
    const hasStatusLabel =
      statusLabel !== "" && statusLabel !== "-" && statusLabel !== "現役";
    const hasNonActiveStatus =
      status !== "" && status !== "-" && status !== "現役";

    return hasMovement || hasStatusChange || hasStatusLabel || hasNonActiveStatus;
  });

  const totalPlayers = players.length;
  const todayPlayers = todayReports.length;
  const enrichedTodayReports = todayReports.map((report) => {
    const matchedPlayer = players.find((player) => {
      return (
        String(player.id || "").trim() === String(report.id || "").trim() ||
        String(player.name || "").trim() === String(report.name || "").trim()
      );
    });

    return {
      ...report,
      type: report.type || matchedPlayer?.type || "",
      league: report.league || matchedPlayer?.league || "",
      team: report.team || matchedPlayer?.team || "",
      level: report.level || matchedPlayer?.level || "",
    };
  });

  const topTodayReports = enrichedTodayReports.filter((report) => {
    const level = String(report.level || "").trim();
    const league = String(report.league || "").trim();

    return (
      level === "MLB" ||
      level === "3A" ||
      level === "2A" ||
      level === "日職一軍" ||
      level === "韓職一軍" ||
      league === "NPB" ||
      league === "KBO" ||
      league === "MLB" ||
      league === "MiLB"
    );
  });

  function countBy(items: Record<string, unknown>[], key: string) {
    return items.reduce((acc: Record<string, number>, item) => {
      const value = String(item[key] || "未分類").trim();

      if (!value || value === "-") {
        acc["未分類"] = (acc["未分類"] || 0) + 1;
      } else {
        acc[value] = (acc[value] || 0) + 1;
      }

      return acc;
    }, {});
  }

  function getRegion(player: Record<string, unknown>) {
    const league = String(player.league || "").trim();

    if (league === "旅美" || league === "MLB" || league === "MiLB") {
      return "美職";
    }

    if (league === "旅日" || league === "NPB") {
      return "日職";
    }

    if (league === "旅韓" || league === "KBO") {
      return "韓職";
    }

    if (league === "台裔") {
      return "台裔";
    }

    return league || "未分類";
  }

  const regionCounts = players.reduce(
    (acc: Record<string, number>, player: Record<string, unknown>) => {
      const region = getRegion(player);
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    },
    {}
  );

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
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-3 pb-6">
      <section className="w-full max-w-7xl mx-auto">

        <SiteHeader
          subtitle="台灣旅外球員追蹤系統"
          showSearch
          playerNameOptions={playerNameOptions}
        />

        <div className="flex flex-col gap-10">
          {/* 第 1 區：三張數字卡 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <p className="text-slate-400 text-sm">異動狀態</p>
              <p className="text-4xl font-bold mt-3">{movedPlayers.length}</p>
              <p className="text-slate-500 text-sm mt-2">
                升降、傷病與狀態異動
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <p className="text-slate-400 text-sm">今日出賽球員</p>
              <p className="text-4xl font-bold mt-3">{todayPlayers}</p>
              <p className="text-slate-500 text-sm mt-2">
                今日有戰報紀錄的球員
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <p className="text-slate-400 text-sm">旅外含台裔球員總數</p>
              <p className="text-4xl font-bold mt-3">{totalPlayers}</p>
              <p className="text-slate-500 text-sm mt-2">
                目前追蹤球員總數
              </p>
            </div>
          </div>

          {/* 第 2 區：異動球員 */}
          <div className="mt-[40px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">異動球員</h2>
              <p className="text-slate-400 text-sm mt-1">
                升降、傷兵、復出、轉隊等
              </p>
            </div>

            <div className="max-h-[300px] overflow-auto">
              <table className="w-full min-w-[680px] text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-30 bg-slate-800 text-slate-300">
                  <tr>
                    <th className="sticky left-0 z-40 bg-slate-800 text-left p-3 w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-700">
                      球員
                    </th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">球隊</th>
                    <th className="text-center p-3 w-[80px] min-w-[80px]">層級</th>
                    <th className="text-center p-3">異動</th>
                    <th className="text-center p-3">狀態</th>
                  </tr>
                </thead>

                <tbody>
                  {movedPlayers.map((player: Record<string, unknown>, index: number) => (
                    <tr
                      key={`${player.name}-${index}`}
                      className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="sticky left-0 z-10 bg-slate-900 p-3 text-left font-bold w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                        <Link
                          href={`/players/${encodeURIComponent(String(player.id || player.name || ""))}`}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {String(player.name ?? "-")}
                        </Link>
                      </td>

                      <td className="p-3 text-left w-[140px] min-w-[140px]">
                        {String(player.team ?? "-")}
                      </td>

                      <td className="p-3 text-center w-[80px] min-w-[80px]">
                        {String(player.level ?? "-")}
                      </td>

                      <td className="p-3 text-center">
                        {String(player.movement ?? "").trim() &&
                        String(player.movement ?? "").trim() !== "-" ? (
                          <span className={getMovementClass(String(player.movement ?? ""))}>
                            {String(player.movement ?? "")}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {String(player.note || player.statusLabel || player.status || "").trim() &&
                        String(player.note || player.statusLabel || player.status || "").trim() !== "-" &&
                        String(player.note || player.statusLabel || player.status || "").trim() !== "現役" ? (
                          <span
                            className={getStatusClass(
                              String(player.note || player.statusLabel || player.status || "")
                            )}
                          >
                            {String(player.note || player.statusLabel || player.status || "")}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 第 3 區：今日戰報 */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">            
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">今日戰報|2A以上球員</h2>
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
                    <th className="text-center p-3 w-[80px] min-w-[80px]">層級</th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">對手</th>
                    <th className="text-left p-3 w-[140px] min-w-[140px]">成績</th>
                  </tr>
                </thead>

                <tbody>
                  {topTodayReports.map((report: Record<string, unknown>, index: number) => (
                    <tr
                      key={`${report.name}-${index}`}
                      className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="sticky left-0 z-10 bg-slate-900 p-3 text-left font-bold w-[140px] min-w-[140px] shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                        <Link
                          href={`/players/${encodeURIComponent(String(report.id || report.name || ""))}`}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {String(report.name ?? "-")}
                        </Link>
                      </td>
                      
                      <td className="p-3 text-left w-[140px] min-w-[140px]">{String(report.team ?? "-")}</td>
                      <td className="p-3 text-center w-[80px] min-w-[80px]">{String(report.level ?? "-")}</td>
                      <td className="p-3 text-left whitespace-nowrap">
                        {String(report.opponent ?? "-")}
                      </td>
                      <td className="p-3 text-left">{String(report.stats ?? "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 第 4 區：美日韓職人數 */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">美日韓職人數</h2>
              <p className="text-slate-400 text-sm mt-1">
                依旅外分類統計
              </p>
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
                  {regionEntries.map(([region, count]: [string, number]) => {
                    const percent =
                      totalPlayers > 0
                        ? Math.round((Number(count) / totalPlayers) * 100)
                        : 0;

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
                    <td className="p-3 text-left text-white font-bold">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 第 5 區：各層級人數 */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold">各層級人數</h2>
              <p className="text-slate-400 text-sm mt-1">
                依目前所屬層級統計
              </p>
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
                  {levelEntries.map(([level, count]: [string, number]) => {
                    const percent =
                      totalPlayers > 0
                        ? Math.round((Number(count) / totalPlayers) * 100)
                        : 0;

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
                    <td className="p-3 text-left text-white font-bold">
                      100%
                    </td>
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