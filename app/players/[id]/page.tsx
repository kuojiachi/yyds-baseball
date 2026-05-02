import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import PlayerPageHeader from "./_components/PlayerPageHeader";
import PlayerInfoCards from "./_components/PlayerInfoCards";

type PlayerPageProps = {
  params: Promise<Record<string, string>>;
};

type StatRow = [string, unknown];

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function displayValue(value: unknown): string {
  const text = normalizeText(value);
  return text === "" ? "-" : text;
}

function displayLeague(league: unknown) {
  const text = normalizeText(league);

  if (text === "MLB" || text === "MiLB") return "美職";
  if (text === "NPB") return "日職";
  if (text === "KBO") return "韓職";

  return text || "-";
}

function getTeamName(player: any) {
  return displayValue(
    player.teams?.abbreviation ||
      player.teams?.name_zh ||
      player.teams?.name_en ||
      player.team_name ||
      player.team
  );
}

function getBetterStatusClass(status: string) {
  if (status === "現役") return "text-green-400";
  if (status === "傷兵") return "text-yellow-400";
  if (status === "DFA") return "text-orange-400";
  if (status === "釋出") return "text-red-400";
  return "text-slate-300";
}

function getMovementStyle(movement: string) {
  if (movement.includes("↑")) return "text-green-400";
  if (movement.includes("↓")) return "text-red-400";
  return "text-slate-400";
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function addNumber(...values: unknown[]): number {
  return values.reduce<number>((sum, value) => {
    return sum + toNumber(value);
  }, 0);
}

function safeDivide(top: number, bottom: number): number | null {
  if (!bottom) return null;
  return top / bottom;
}

function formatRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(3).replace(/^0/, "");
}

function formatDecimal(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function getRelatedPlayer(row: any) {
  return Array.isArray(row.players) ? row.players[0] : row.players;
}

function isPitcher(player: any) {
  const position = normalizeText(player.position).toLowerCase();
  return position.includes("投") || position.includes("pitcher") || position === "p";
}

function parseHitterStatsText(stats: unknown) {
  const text = normalizeText(stats);
  const match = text.match(/^(\d+)-(\d+)-(\d+)$/);

  if (!match) {
    return { ab: 0, h: 0, rbi: 0 };
  }

  return {
    ab: toNumber(match[1]),
    h: toNumber(match[2]),
    rbi: toNumber(match[3]),
  };
}

function hasRealGameReport(report: any): boolean {
  const stats = normalizeText(report.stats);
  const parsedStats = parseHitterStatsText(stats);

  const hasTextStats = stats !== "" && stats !== "-" && stats !== "0-0-0";
  const hasParsedStats = parsedStats.ab > 0 || parsedStats.h > 0 || parsedStats.rbi > 0;

  const hasNumberStats =
    toNumber(report.ab) > 0 ||
    toNumber(report.h) > 0 ||
    toNumber(report.rbi) > 0 ||
    toNumber(report.ip) > 0 ||
    toNumber(report.innings) > 0 ||
    toNumber(report.pitches) > 0;

  return hasTextStats || hasParsedStats || hasNumberStats;
}

function getHitterReportTotals(reports: any[]) {
  return reports.reduce(
    (totals, report) => {
      const parsed = parseHitterStatsText(report.stats);

      totals.games += 1;
      totals.ab += addNumber(report.at_bats, report.atBats, report.ab, parsed.ab);
      totals.h += addNumber(report.hits, report.h, parsed.h);
      totals.doubles += addNumber(report.doubles, report["2b"]);
      totals.triples += addNumber(report.triples, report["3b"]);
      totals.hr += addNumber(report.home_runs, report.homeRuns, report.hr);
      totals.rbi += addNumber(report.rbi, parsed.rbi);
      totals.runs += addNumber(report.runs, report.r);
      totals.bb += addNumber(report.walks, report.bb);
      totals.so += addNumber(report.strikeouts, report.so);
      totals.sb += addNumber(report.stolen_bases, report.stolenBases, report.sb);

      return totals;
    },
    {
      games: 0,
      ab: 0,
      h: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      rbi: 0,
      runs: 0,
      bb: 0,
      so: 0,
      sb: 0,
    }
  );
}

function getPitcherReportTotals(reports: any[]) {
  return reports.reduce(
    (totals, report) => {
      totals.games += 1;
      totals.starts += toNumber(report.starts ?? report.gs ?? report.is_starting);
      totals.wins += toNumber(report.wins ?? report.w);
      totals.losses += toNumber(report.losses ?? report.l);
      totals.ipOuts += ipToOuts(report.innings ?? report.ip);
      totals.pitches += toNumber(report.pitches);
      totals.runsAllowed += toNumber(report.runs_allowed ?? report.runsAllowed);
      totals.earnedRuns += toNumber(report.earned_runs ?? report.earnedRuns ?? report.er);
      totals.hitsAllowed += toNumber(report.hits_allowed ?? report.hitsAllowed ?? report.h);
      totals.homeRunsAllowed += toNumber(report.home_runs_allowed ?? report.homeRunsAllowed ?? report.hr);
      totals.walksAllowed += toNumber(report.walks_allowed ?? report.walksAllowed ?? report.bb);
      totals.strikeouts += toNumber(report.strikeouts_pitching ?? report.strikeoutsPitching ?? report.so);

      return totals;
    },
    {
      games: 0,
      starts: 0,
      wins: 0,
      losses: 0,
      ipOuts: 0,
      pitches: 0,
      runsAllowed: 0,
      earnedRuns: 0,
      hitsAllowed: 0,
      homeRunsAllowed: 0,
      walksAllowed: 0,
      strikeouts: 0,
    }
  );
}

function getHitterStats(player: any, reports: any[]): StatRow[] {
  const reportTotals = getHitterReportTotals(reports);

  const games = addNumber(player.games ?? player.g, reportTotals.games);
  const ab = addNumber(player.at_bats ?? player.atBats ?? player.ab, reportTotals.ab);
  const h = addNumber(player.hits ?? player.h, reportTotals.h);
  const doubles = addNumber(player.doubles ?? player["2b"], reportTotals.doubles);
  const triples = addNumber(player.triples ?? player["3b"], reportTotals.triples);
  const hr = addNumber(player.home_runs ?? player.homeRuns ?? player.hr, reportTotals.hr);
  const rbi = addNumber(player.rbi, reportTotals.rbi);
  const runs = addNumber(player.runs ?? player.r, reportTotals.runs);
  const bb = addNumber(player.walks ?? player.bb, reportTotals.bb);
  const so = addNumber(player.strikeouts ?? player.so, reportTotals.so);
  const sb = addNumber(player.stolen_bases ?? player.stolenBases ?? player.sb, reportTotals.sb);

  const totalBases = h + doubles + triples * 2 + hr * 3;
  const avg = safeDivide(h, ab);
  const obp = safeDivide(h + bb, ab + bb);
  const slg = safeDivide(totalBases, ab);
  const ops = obp === null && slg === null ? null : (obp ?? 0) + (slg ?? 0);

  return [
    ["出賽", games],
    ["打數", ab],
    ["安打", h],
    ["二安", doubles],
    ["三安", triples],
    ["全壘打", hr],
    ["打點", rbi],
    ["得分", runs],
    ["四壞", bb],
    ["三振", so],
    ["盜壘", sb],
    ["AVG", formatRate(avg)],
    ["OBP", formatRate(obp)],
    ["SLG", formatRate(slg)],
    ["OPS", formatRate(ops)],
  ];
}

function getPitcherStats(player: any, reports: any[]): StatRow[] {
  const reportTotals = getPitcherReportTotals(reports);

  const games = addNumber(player.games ?? player.g, reportTotals.games);
  const starts = addNumber(player.starts ?? player.gs, reportTotals.starts);
  const wins = addNumber(player.wins ?? player.w, reportTotals.wins);
  const losses = addNumber(player.losses ?? player.l, reportTotals.losses);
  const ipOuts = ipToOuts(player.innings ?? player.ip) + reportTotals.ipOuts;
  const ip = outsToIp(ipOuts);
  const ipForRate = ipOuts / 3;
  const pitches = addNumber(player.pitches, reportTotals.pitches);
  const runsAllowed = addNumber(player.runs_allowed ?? player.runsAllowed, reportTotals.runsAllowed);
  const earnedRuns = addNumber(player.earned_runs ?? player.earnedRuns, reportTotals.earnedRuns);
  const hitsAllowed = addNumber(player.hits_allowed ?? player.hitsAllowed, reportTotals.hitsAllowed);
  const homeRunsAllowed = addNumber(player.home_runs_allowed ?? player.homeRunsAllowed, reportTotals.homeRunsAllowed);
  const walksAllowed = addNumber(player.walks_allowed ?? player.walksAllowed, reportTotals.walksAllowed);
  const strikeouts = addNumber(player.strikeouts_pitching ?? player.strikeoutsPitching, reportTotals.strikeouts);

  const era = safeDivide(earnedRuns * 9, ipForRate);
  const whip = safeDivide(hitsAllowed + walksAllowed, ipForRate);
  const k9 = safeDivide(strikeouts * 9, ipForRate);
  const bb9 = safeDivide(walksAllowed * 9, ipForRate);
  const hr9 = safeDivide(homeRunsAllowed * 9, ipForRate);

  return [
    ["出賽", games],
    ["先發", starts],
    ["勝", wins],
    ["敗", losses],
    ["局數", ip],
    ["投球數", pitches],
    ["失分", runsAllowed],
    ["責失", earnedRuns],
    ["被安打", hitsAllowed],
    ["被全壘打", homeRunsAllowed],
    ["四壞", walksAllowed],
    ["三振", strikeouts],
    ["ERA", formatDecimal(era)],
    ["WHIP", formatDecimal(whip)],
    ["K/9", formatDecimal(k9)],
    ["BB/9", formatDecimal(bb9)],
    ["HR/9", formatDecimal(hr9)],
  ];
}

function getAnnualStats(player: any, reports: any[]): StatRow[] {
  return isPitcher(player) ? getPitcherStats(player, reports) : getHitterStats(player, reports);
}

function StatGrid({ title, rows }: { title: string; rows: StatRow[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
        {rows.map(([label, value]) => (
          <div key={label} className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold mt-2">{displayValue(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ipToOuts(ipValue: unknown): number {
  const value = toNumber(ipValue);
  if (!value) return 0;

  return Math.round(value * 3);
}

function outsToIp(outs: number): string {
  const whole = Math.floor(outs / 3);
  const remainder = outs % 3;

  return `${whole}.${remainder}`;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const routeParams = await params;
  const id = routeParams.id || routeParams.slug || routeParams.playerId || Object.values(routeParams)[0];
  const decodedId = decodeURIComponent(id || "");

  const players = (await getPlayers()) as any[];
  const reports = (await getDailyReports()) as any[];
  const events = (await getPlayerEvents()) as any[];

  const player = players.find((p: any) => {
    return (
      String(p.id) === decodedId ||
      String(p.name_zh) === decodedId ||
      String(p.name_en) === decodedId
    );
  }) as any;

  const playerNameOptions = getPlayerNameOptions(players as any);

  if (!player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
        <section className="w-full max-w-5xl mx-auto">
          <SiteHeader subtitle="球員個人頁" showSearch playerNameOptions={playerNameOptions as any} />

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h1 className="text-3xl font-bold">找不到球員</h1>
            <p className="mt-2 text-slate-400">{decodedId}</p>
          </div>
        </section>
      </main>
    );
  }

  const playerReports = reports.filter((report: any) => {
    return String(report.player_id) === String(player.id) && hasRealGameReport(report);
  });

  const playerEvents = events
    .filter((event: any) => {
      const related = getRelatedPlayer(event);

      return (
        String(event.player_id) === String(player.id) ||
        normalizeText(event.name_zh) === normalizeText(player.name_zh) ||
        normalizeText(related?.name_zh) === normalizeText(player.name_zh)
      );
    })
    .sort((a: any, b: any) => {
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });

  const playerRole = isPitcher(player) ? "投手" : "野手";

  const annualStats = getAnnualStats(player, playerReports);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="w-full max-w-5xl mx-auto">
        <SiteHeader subtitle="球員個人頁" showSearch playerNameOptions={playerNameOptions as any} />

        <PlayerPageHeader player={player} />

        <PlayerInfoCards
          player={player}
          playerEvents={playerEvents}
          playerReports={playerReports}
        />

        <StatGrid title="年度數據" rows={annualStats} />

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-xl font-bold">歷史成績</h2>
            <p className="text-slate-400 text-sm mt-1">
              依年度、聯盟、球隊、層級分段；升降階會分開顯示
            </p>
          </div>

          <div className="p-5 text-slate-400">
            尚未建立歷史成績資料來源
          </div>
        </div>
      </section>
    </main>
  );
}