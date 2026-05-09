import Link from "next/link";
import SiteHeader from "@/src/components/SiteHeader";
import { supabase } from "@/src/lib/supabase";

type Player = {
  id: string;
  name_zh: string;
  level: string | null;
  league: string | null;
  current_team_id: string | null;
};

type Team = {
  id: string;
  name_zh: string | null;
};

type PlayerEvent = {
  id: string;
  name_zh: string | null;
  event_date: string | null;
  event_type: string | null;
  status: string | null;
};

type InjuryRankingRow = {
  playerId: string;
  nameZh: string;
  league: string;
  level: string;
  teamName: string;
  il7: number;
  il10: number;
  il15: number;
  il60: number;
  injuryCount: number;
  injuryDays: number;
  injuryScore: number;
};

function toDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(start: string | null, end: string | null) {
  const startDate = toDate(start);
  const endDate = end ? toDate(end) : new Date();

  if (!startDate || !endDate) return 0;

  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function getInjuryScore(status: string | null) {
  switch (status) {
    case "IL7":
      return 1;
    case "IL10":
      return 2;
    case "IL15":
      return 3;
    case "IL60":
      return 5;
    default:
      return 0;
  }
}

function addIlCount(row: InjuryRankingRow, status: string | null) {
  if (status === "IL7") row.il7 += 1;
  if (status === "IL10") row.il10 += 1;
  if (status === "IL15") row.il15 += 1;
  if (status === "IL60") row.il60 += 1;
}

export default async function InjuryRankingPage() {
  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("id, name_zh, league, level, current_team_id")
    .order("name_zh", { ascending: true });

  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, name_zh");

  const { data: eventsData, error: eventsError } = await supabase
    .from("player_events")
    .select("id, name_zh, event_date, event_type, status")
    .in("event_type", ["injury", "active"])
    .order("event_date", { ascending: true });

  if (playersError || eventsError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-bold">痛痛人排行榜</h1>
          <p className="mt-4 text-red-300">
            讀取資料失敗：{playersError?.message || eventsError?.message}
          </p>
        </section>
      </main>
    );
  }

  const players = (playersData ?? []) as Player[];
  const events = (eventsData ?? []) as PlayerEvent[];
  const teams = (teamsData ?? []) as Team[];

  const teamMap = new Map<string, string>();

  for (const team of teams) {
    teamMap.set(team.id, team.name_zh ?? "-");
  }

  const playerMap = new Map<string, Player>();

  for (const player of players) {
    playerMap.set(player.name_zh, player);
  }

  const rankingMap = new Map<string, InjuryRankingRow>();
  const activeInjuries = new Map<string, PlayerEvent>();

  function getRow(nameZh: string): InjuryRankingRow | null {
    const player = playerMap.get(nameZh);
    if (!player) return null;

    if (!rankingMap.has(nameZh)) {
      rankingMap.set(nameZh, {
        playerId: player.id,
        nameZh,
        league: player.league ?? "-",
        level: player.level ?? "-",
        teamName: player.current_team_id
          ? teamMap.get(player.current_team_id) ?? "-"
          : "-",
        il7: 0,
        il10: 0,
        il15: 0,
        il60: 0,
        injuryCount: 0,
        injuryDays: 0,
        injuryScore: 0,
      });
    }

    return rankingMap.get(nameZh) ?? null;
  }

  for (const event of events) {
    const nameZh = event.name_zh;
    if (!nameZh || !event.event_date) continue;

    const row = getRow(nameZh);
    if (!row) continue;

    if (event.event_type === "injury") {
      const existingInjury = activeInjuries.get(nameZh);

      if (!existingInjury) {
        row.injuryCount += 1;

        activeInjuries.set(nameZh, event);
        }

        addIlCount(row, event.status);
        row.injuryScore += getInjuryScore(event.status);
    }

    if (event.event_type === "active") {
      const injuryEvent = activeInjuries.get(nameZh);

      if (injuryEvent) {
        row.injuryDays += diffDays(injuryEvent.event_date, event.event_date);
        activeInjuries.delete(nameZh);
      }
    }
  }

  for (const [nameZh, injuryEvent] of activeInjuries.entries()) {
    const row = getRow(nameZh);
    if (!row) continue;

    row.injuryDays += diffDays(injuryEvent.event_date, null);
  }

  const rankings = Array.from(rankingMap.values())
    .filter((row) => row.injuryCount > 0)
    .sort((a, b) => {
        if (b.injuryScore !== a.injuryScore) return b.injuryScore - a.injuryScore;
        if (b.injuryDays !== a.injuryDays) return b.injuryDays - a.injuryDays;
        if (b.injuryCount !== a.injuryCount) return b.injuryCount - a.injuryCount;
        return a.nameZh.localeCompare(b.nameZh, "zh-Hant");
    });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/rankings"
            className="mb-3 inline-flex text-sm font-semibold text-sky-300 hover:text-sky-200 hover:underline"
          >
            ← 回排行榜
          </Link>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            痛痛人排行榜
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            統計球員傷兵次數、總天數與痛痛值
          </p>
        </div>

        <div className="max-h-[75vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-slate-800 text-slate-300">
              <tr>
                <th className="w-16 px-4 py-3 text-left">排名</th>
                <th className="sticky left-0 z-30 min-w-[170px] whitespace-nowrap bg-slate-800 px-4 py-3 text-left">
                  球員
                </th>
                <th className="w-28 px-4 py-3 text-left">聯盟</th>
                <th className="w-28 px-4 py-3 text-left">目前層級</th>
                <th className="min-w-[140px] whitespace-nowrap px-4 py-3 text-left">
                  球隊
                </th>
                <th className="w-20 px-4 py-3 text-right">IL7</th>
                <th className="w-20 px-4 py-3 text-right">IL10</th>
                <th className="w-20 px-4 py-3 text-right">IL15</th>
                <th className="w-20 px-4 py-3 text-right">IL60</th>
                <th className="w-28 px-4 py-3 text-right">總次數</th>
                <th className="w-28 px-4 py-3 text-right">總天數</th>
                <th className="w-28 px-4 py-3 text-right">痛痛值</th>
              </tr>
            </thead>

            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    目前沒有 injury 紀錄。
                  </td>
                </tr>
              ) : (
                rankings.map((row, index) => (
                  <tr
                    key={row.playerId}
                    className="border-t border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-bold text-slate-300">
                      {index + 1}
                    </td>

                    <td className="sticky left-0 z-10 min-w-[170px] whitespace-nowrap bg-slate-900 px-4 py-3 font-bold">
                      <Link
                        href={`/players/${row.playerId}`}
                        className="text-sky-300 hover:text-sky-200 hover:underline"
                      >
                        {row.nameZh}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-slate-300">{row.league}</td>
                    <td className="px-4 py-3 text-slate-300">{row.level}</td>
                    <td className="min-w-[140px] whitespace-nowrap px-4 py-3 text-slate-300">
                      {row.teamName}
                    </td>

                    <td className="px-4 py-3 text-right">{row.il7}</td>
                    <td className="px-4 py-3 text-right">{row.il10}</td>
                    <td className="px-4 py-3 text-right">{row.il15}</td>
                    <td className="px-4 py-3 text-right">{row.il60}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {row.injuryCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {row.injuryDays}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-rose-300">
                      {row.injuryScore}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}