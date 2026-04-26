import SiteHeader from "@/src/components/SiteHeader";
import {
  getPlayersFromExcel,
  type Player,
} from "@/src/lib/excel";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import { getMovementClass, getStatusClass } from "@/src/utils/playerStyles";

type PlayerPageProps = {
  params: Promise<{
    name: string;
  }>;
};

type StatRow = [string, string | undefined];

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function displayValue(value: unknown): string {
  const text = normalizeText(value);

  return text === "" ? "-" : text;
}

function displayLeague(league: string): string {
  const text = normalizeText(league);

  if (text === "旅美" || text === "MLB" || text === "MiLB") return "美職";
  if (text === "旅日" || text === "NPB") return "日職";
  if (text === "旅韓" || text === "KBO") return "韓職";

  return text || "-";
}

function getPlayerType(player: Player): string {
  return normalizeText(player.type).replace(/\s/g, "").replace(/　/g, "");
}

function isPitcher(player: Player): boolean {
  const type = getPlayerType(player);
  const lowerType = type.toLowerCase();

  return (
    type.includes("投手") ||
    lowerType.includes("pitcher") ||
    lowerType === "p"
  );
}

function getBasicStats(player: Player): StatRow[] {
  if (isPitcher(player)) {
    return [
      ["出賽", player.games],
      ["先發", player.starts],
      ["勝", player.wins],
      ["敗", player.losses],
      ["局數", player.innings],
      ["面對打者", player.battersFaced],
      ["投球數", player.pitches],
      ["失分", player.runsAllowed],
      ["責失", player.earnedRuns],
      ["被安打", player.hitsAllowed],
      ["被全壘打", player.homeRunsAllowed],
      ["四壞", player.walksAllowed],
      ["三振", player.strikeoutsPitching],
    ];
  }

  return [
    ["出賽", player.games],
    ["打數", player.atBats],
    ["安打", player.hits],
    ["二安", player.doubles],
    ["三安", player.triples],
    ["全壘打", player.homeRuns],
    ["打點", player.rbi],
    ["得分", player.runs],
    ["四壞", player.walks],
    ["三振", player.strikeouts],
    ["盜壘", player.stolenBases],
  ];
}

function getAdvancedStats(player: Player): StatRow[] {
  if (isPitcher(player)) {
    return [
      ["ERA", player.era],
      ["ERA+", player.eraPlus],
      ["FIP", player.fip],
      ["WHIP", player.whip],
      ["LOB%", player.lobRate],
      ["BABIP", player.babipAllowed],
      ["AVG", player.avgAllowed],
      ["OBP", player.obpAllowed],
      ["SLG", player.slgAllowed],
      ["OPS+", player.opsPlusAllowed],
      ["H9", player.h9],
      ["HR9", player.hr9],
      ["BB%", player.bbRatePitching],
      ["K%", player.kRatePitching],
      ["Whiff%", player.whiffRate],
    ];
  }

  return [
    ["AVG", player.avg],
    ["OBP", player.obp],
    ["SLG", player.slg],
    ["OPS", player.ops],
    ["OPS+", player.opsPlus],
    ["ISO", player.iso],
    ["BABIP", player.babip],
    ["BB%", player.bbRate],
    ["K%", player.kRate],
    ["Whiff%", player.whiffRate],
    ["wOBA", player.woba],
  ];
}

function InfoRows({ rows }: { rows: StatRow[] }) {
  return (
    <div className="divide-y divide-slate-800">
      {rows.map(([label, value]) => {
        const text = displayValue(value);
        const isMovement = label === "升降";
        const isStatus = label === "狀態異動";

        return (
          <div
            key={label}
            className="grid grid-cols-[100px_1fr] gap-4 py-3 text-sm"
          >
            <div className="text-slate-400">{label}</div>
            <div className="font-medium text-white">
              {isMovement ? (
                <span className={getMovementClass(text)}>{text}</span>
              ) : isStatus ? (
                <span className={getStatusClass(text)}>{text}</span>
              ) : (
                text
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsTable({
  title,
  rows,
}: {
  title: string;
  rows: StatRow[];
}) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3 text-left">數據名稱</th>
              <th className="p-3 text-left">數值</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(([label, value]) => (
              <tr
                key={label}
                className="border-t border-slate-800 hover:bg-slate-800/60"
              >
                <td className="p-3 text-slate-400">{label}</td>
                <td className="p-3 font-medium text-white">
                  {displayValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const players = await getPlayersFromExcel();

  const player = players.find((item) => {
    return item.id === decodedName || item.name === decodedName;
  });

  const playerNameOptions = getPlayerNameOptions(players);
    if (!player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 pt-3 pb-6">
        <section className="w-full max-w-5xl mx-auto">
          <SiteHeader
            subtitle="球員個人頁"
            showSearch
            playerNameOptions={playerNameOptions}
          />

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h1 className="text-3xl font-bold">找不到球員</h1>
            <p className="mt-2 text-slate-400">{decodedName}</p>
          </div>
        </section>
      </main>
    );
  }

  const profileRows: StatRow[] = [
    ["守位", player.type],
    ["聯盟", displayLeague(player.league)],
    ["球隊", player.team],
    ["層級", player.level],
    ["升降", player.movement],
    ["狀態異動", player.note],
    ["上次先發", player.lastStart],
    ["預期先發", player.expectedStart],
  ];

  const basicStats = getBasicStats(player);
  const advancedStats = getAdvancedStats(player);
  const playerRole = isPitcher(player) ? "投手" : "野手";

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-3 pb-6">
      <section className="w-full max-w-5xl mx-auto">
        <SiteHeader
          subtitle="球員個人頁"
          showSearch
          playerNameOptions={playerNameOptions}
        />

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-slate-400">{playerRole}</p>
              <h1 className="text-4xl font-bold">{player.name}</h1>
            </div>

            <p className="text-sm text-slate-400">
              {displayLeague(player.league)}｜{displayValue(player.level)}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
            <InfoRows rows={profileRows} />
          </div>

          <StatsTable title="基本數據" rows={basicStats} />
          <StatsTable title="進階數據" rows={advancedStats} />
        </div>
      </section>
    </main>
  );
}