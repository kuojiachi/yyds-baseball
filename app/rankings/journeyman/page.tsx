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
  from_team: string | null;
  to_team: string | null;
};

type JourneymanRankingRow = {
  playerId: string;
  nameZh: string;
  league: string;
  level: string;
  teamName: string;
  movementCount: number;
  teamCount: number;
};

const MOVEMENT_TYPES = [
  "trade",
  "dfa",
];

function cleanTeamName(value: string | null) {
  const text = String(value ?? "").trim();

  if (!text || text === "-") return "";

  const parts = text.split("｜");

  if (parts.length >= 2) {
    return parts[1].replace(/\s+(MLB|3A|2A|1A|A\+|RK|DSL)$/i, "").trim();
  }

  return text;
}

export default async function JourneymanRankingPage() {
  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("id, name_zh, league, level, current_team_id")
    .order("name_zh", { ascending: true });

  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, name_zh");

  const { data: eventsData, error: eventsError } = await supabase
    .from("player_events")
    .select("id, name_zh, event_date, event_type, from_team, to_team")
    .in("event_type", MOVEMENT_TYPES)
    .order("event_date", { ascending: true });

  if (playersError || teamsError || eventsError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-bold">浪人排行榜</h1>
          <p className="mt-4 text-red-300">
            讀取資料失敗：
            {playersError?.message || teamsError?.message || eventsError?.message}
          </p>
        </section>
      </main>
    );
  }

  const players = (playersData ?? []) as Player[];
  const teams = (teamsData ?? []) as Team[];
  const events = (eventsData ?? []) as PlayerEvent[];

  const teamMap = new Map<string, string>();
  for (const team of teams) {
    teamMap.set(team.id, team.name_zh ?? "-");
  }

  const playerMap = new Map<string, Player>();
  for (const player of players) {
    playerMap.set(player.name_zh, player);
  }

  const rankingMap = new Map<string, JourneymanRankingRow>();
  const playedTeamsMap = new Map<string, Set<string>>();

  function getRow(nameZh: string): JourneymanRankingRow | null {
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
        movementCount: 0,
        teamCount: 0,
      });
    }

    if (!playedTeamsMap.has(nameZh)) {
      playedTeamsMap.set(nameZh, new Set<string>());
    }

    return rankingMap.get(nameZh) ?? null;
  }

  for (const event of events) {
    const nameZh = event.name_zh;
    if (!nameZh) continue;

    const row = getRow(nameZh);
    if (!row) continue;

    row.movementCount += 1;

    const playedTeams = playedTeamsMap.get(nameZh);
    if (!playedTeams) continue;

    const fromTeam = cleanTeamName(event.from_team);
    const toTeam = cleanTeamName(event.to_team);

    if (fromTeam) playedTeams.add(fromTeam);
    if (toTeam) playedTeams.add(toTeam);

    row.teamCount = playedTeams.size;
  }

  const rankings = Array.from(rankingMap.values())
    .filter((row) => row.movementCount > 0)
    .sort((a, b) => {
      if (b.teamCount !== a.teamCount) return b.teamCount - a.teamCount;
      if (b.movementCount !== a.movementCount) {
        return b.movementCount - a.movementCount;
      }
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
            浪人排行榜
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            依效力球隊數與異動次數統計旅外球員流動程度
          </p>
        </div>

        <div className="max-h-[75vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <table className="min-w-[860px] w-full border-collapse text-sm">
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
                <th className="w-28 px-4 py-3 text-right">異動次數</th>
                <th className="w-32 px-4 py-3 text-right">效力球隊數</th>
              </tr>
            </thead>

            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    目前沒有符合條件的異動紀錄。
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
                    <td className="px-4 py-3 text-right font-semibold">
                      {row.movementCount}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-amber-300">
                      {row.teamCount}
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