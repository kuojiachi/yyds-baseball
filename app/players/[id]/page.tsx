import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import PlayerPageHeader from "./_components/PlayerPageHeader";
import PlayerStatsTabs from "./_components/PlayerStatsTabs";

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
      totals.games += 1;
      totals.ab += toNumber(report.ab);
      totals.pa += toNumber(report.pa);
      totals.h += toNumber(report.h);
      totals.doubles += toNumber(report.doubles);
      totals.triples += toNumber(report.triples);
      totals.hr += toNumber(report.hr);
      totals.rbi += toNumber(report.rbi);
      totals.runs += toNumber(report.r);
      totals.bb += toNumber(report.bb);
      totals.k += toNumber(report.k);
      totals.sb += toNumber(report.sb);
      totals.hbp += toNumber(report.hbp);
      totals.sf += toNumber(report.sf);

      return totals;
    },
    {
      games: 0,
      ab: 0,
      pa: 0,
      h: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      rbi: 0,
      runs: 0,
      bb: 0,
      k: 0,
      sb: 0,
      hbp: 0,
      sf: 0,
    }
  );
}

function getPitcherReportTotals(reports: any[]) {
  return reports.reduce(
    (totals, report) => {
      totals.games += 1;
      totals.ipOuts += ipToOuts(report.ip);
      totals.er += toNumber(report.er);
      totals.h += toNumber(report.h);
      totals.bb += toNumber(report.bb);
      totals.k += toNumber(report.k);
      totals.bf += toNumber(report.bf);

      return totals;
    },
    {
      games: 0,
      ipOuts: 0,
      er: 0,
      h: 0,
      bb: 0,
      k: 0,
      bf: 0,
    }
  );
}

function getHitterStats(player: any, reports: any[]): StatRow[] {
  const t = getHitterReportTotals(reports);

  const ab = t.ab;
  const h = t.h;

  const singles = h - t.doubles - t.triples - t.hr;
  const tb = singles + t.doubles * 2 + t.triples * 3 + t.hr * 4;

  const avg = safeDivide(h, ab);

  const obp = safeDivide(
    h + t.bb + t.hbp,
    t.pa
  );

  const slg = safeDivide(tb, ab);
  const ops = (obp ?? 0) + (slg ?? 0);

  const iso = slg === null || avg === null ? null : slg - avg;

  const babip = safeDivide(
    h - t.hr,
    ab - t.k - t.hr + t.sf
  );
  const kRate = safeDivide(t.k, t.pa);
  const bbRate = safeDivide(t.bb, t.pa);

  return [
    ["出賽", t.games],
    ["打數", ab],
    ["安打", h],
    ["二安", t.doubles],
    ["三安", t.triples],
    ["全壘打", t.hr],
    ["打點", t.rbi],
    ["得分", t.runs],
    ["四壞", t.bb],
    ["三振", t.k],
    ["盜壘", t.sb],
    ["HBP", t.hbp],
    ["SF", t.sf],
    ["AVG", formatRate(avg)],
    ["OBP", formatRate(obp)],
    ["SLG", formatRate(slg)],
    ["OPS", formatRate(ops)],
    ["ISO", formatRate(iso)],
    ["BABIP", formatRate(babip)],
    ["K%", formatRate(kRate)],
    ["BB%", formatRate(bbRate)],
  ];
}

function getPitcherStats(player: any, reports: any[]): StatRow[] {
  const t = getPitcherReportTotals(reports);

  const ip = outsToIp(t.ipOuts);
  const ipVal = t.ipOuts / 3;

  const era = safeDivide(t.er * 9, ipVal);
  const whip = safeDivide(t.bb + t.h, ipVal);

  const k9 = safeDivide(t.k * 9, ipVal);
  const bb9 = safeDivide(t.bb * 9, ipVal);
  const kbb = safeDivide(t.k, t.bb);

  const kRate = safeDivide(t.k, t.bf);
  const bbRate = safeDivide(t.bb, t.bf);

  const babip = safeDivide(
    t.h - t.hr,
    t.bf - t.k - t.bb - t.hbp - t.hr
  );

  return [
    ["出賽", t.games],
    ["局數", ip],
    ["責失", t.er],
    ["被安打", t.h],
    ["四壞", t.bb],
    ["三振", t.k],
    ["ERA", formatDecimal(era)],
    ["WHIP", formatDecimal(whip)],
    ["K/9", formatDecimal(k9)],
    ["BB/9", formatDecimal(bb9)],
    ["K/BB", formatDecimal(kbb)],
    ["K%", formatRate(kRate)],
    ["BB%", formatRate(bbRate)],
    ["BABIP", formatRate(babip)],
  ];
}

function getAnnualStats(player: any, reports: any[]): StatRow[] {
  return isPitcher(player) ? getPitcherStats(player, reports) : getHitterStats(player, reports);
}

function groupReportsByLevel(reports: any[]) {
  const groups: Record<string, any[]> = {};

  for (const report of reports) {
    const level = normalizeText(report.level) || "未標層級";

    if (!groups[level]) {
      groups[level] = [];
    }

    groups[level].push(report);
  }

  return groups;
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

  const currentYear = new Date().getFullYear();

  const currentYearReports = playerReports.filter((report: any) => {
    const reportYear = new Date(report.report_date).getFullYear();
    return reportYear === currentYear;
  });

const regularReports = currentYearReports.filter((report: any) => {
  return (report.game_type || "regular") === "regular";
});

const postseasonReports = currentYearReports.filter((report: any) => {
  return report.game_type === "postseason";
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

  const annualStats = getAnnualStats(player, currentYearReports);

  const reportsByLevel = groupReportsByLevel(currentYearReports);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="w-full max-w-5xl mx-auto">
        <SiteHeader subtitle="球員個人頁" showSearch playerNameOptions={playerNameOptions as any} />

        <PlayerPageHeader
          player={player}
          playerEvents={playerEvents}
          playerReports={playerReports}
        />
        <PlayerStatsTabs
          player={player}
          playerReports={playerReports}
          playerEvents={playerEvents}
        />
        </section>
    </main>
  );
}