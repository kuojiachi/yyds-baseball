import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import { normalizeLevel } from "@/src/utils/playerEvents";
import PlayerPageHeader from "./_components/PlayerPageHeader";
import PlayerStatsTabs from "./_components/PlayerStatsTabs";

type PlayerPageProps = {
  params: Promise<Record<string, string>>;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getRelatedPlayer(row: any) {
  return Array.isArray(row.players) ? row.players[0] : row.players;
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
  const hasParsedStats =
    parsedStats.ab > 0 || parsedStats.h > 0 || parsedStats.rbi > 0;

  const hasNumberStats =
    toNumber(report.ab) > 0 ||
    toNumber(report.h) > 0 ||
    toNumber(report.rbi) > 0 ||
    toNumber(report.ip) > 0 ||
    toNumber(report.innings) > 0 ||
    toNumber(report.pitches) > 0;

  return hasTextStats || hasParsedStats || hasNumberStats;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const routeParams = await params;
  const id =
    routeParams.id ||
    routeParams.slug ||
    routeParams.playerId ||
    Object.values(routeParams)[0];

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
          <SiteHeader
            subtitle="球員個人頁"
            showSearch
            playerNameOptions={playerNameOptions as any}
          />

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h1 className="text-3xl font-bold">找不到球員</h1>
            <p className="mt-2 text-slate-400">{decodedId}</p>
          </div>
        </section>
      </main>
    );
  }

  const normalizedPlayer = {
    ...player,
    level: normalizeLevel(player.level, player.league),
  };

  const playerReports = reports.filter((report: any) => {
    return (
      String(report.player_id) === String(player.id) &&
      hasRealGameReport(report)
    );
  });

  const normalizedPlayerReports = playerReports.map((report: any) => ({
    ...report,
    level: normalizeLevel(report.level, report.league || player.league),
    league: report.league || player.league,
  }));

  const playerEvents = events
    .filter((event: any) => {
      const related = getRelatedPlayer(event);

      return (
        String(event.player_id) === String(player.id) ||
        normalizeText(event.name_zh) === normalizeText(player.name_zh) ||
        normalizeText(related?.name_zh) === normalizeText(player.name_zh)
      );
    })
    .map((event: any) => ({
      ...event,
      level: normalizeLevel(event.level, event.league || player.league),
      from_level: normalizeLevel(event.from_level, event.league || player.league),
      to_level: normalizeLevel(event.to_level, event.league || player.league),
      league: event.league || player.league,
    }))
    .sort((a: any, b: any) => {
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="w-full max-w-5xl mx-auto">
        <SiteHeader
          subtitle="球員個人頁"
          showSearch
          playerNameOptions={playerNameOptions as any}
        />

        <PlayerPageHeader
          player={normalizedPlayer}
          playerEvents={playerEvents}
          playerReports={normalizedPlayerReports}
        />

        <PlayerStatsTabs
          player={normalizedPlayer}
          playerReports={normalizedPlayerReports}
          playerEvents={playerEvents}
        />
      </section>
    </main>
  );
}