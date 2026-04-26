import Link from "next/link";
import { getPlayersFromExcel } from "@/src/lib/excel";

type PlayerPageProps = {
  params: Promise<{
    name: string;
  }>;
};

function displayLeague(league: string) {
  return league
    .replace("旅美", "美職")
    .replace("旅日", "日職")
    .replace("旅韓", "韓職");
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const players = await getPlayersFromExcel();
  const player = players.find((item) => item.name === decodedName);

  if (!player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <section className="max-w-3xl mx-auto">
          <Link href="/players" className="text-sky-300 hover:underline">
            ← 回總表
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h1 className="text-3xl font-bold">找不到球員</h1>
            <p className="mt-2 text-slate-400">{decodedName}</p>
          </div>
        </section>
      </main>
    );
  }

  const rows = [
    ["守位", player.type],
    ["聯盟", displayLeague(player.league || "")],
    ["球隊", player.team],
    ["層級", player.level],
    ["升降", player.movement],
    ["狀態異動", player.note || player.status],
    ["上次先發", player.lastStart],
    ["預期先發", player.expectedStart],
  ];

  const playerType = String(player.type || "")
    .replace(/\s/g, "")
    .replace(/　/g, "")
    .trim();

  const isPitcher =
    playerType.includes("投手") ||
    playerType.toLowerCase().includes("pitcher") ||
    playerType.toLowerCase() === "p";

  const basicStats = isPitcher
    ? [
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
        ["全壘打", player.homeRunsAllowed],
        ["四壞", player.walksAllowed],
        ["三振", player.strikeoutsPitching],
      ]
    : [
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

  const advancedStats = isPitcher
    ? [
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
      ]
    : [
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

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <section className="max-w-3xl mx-auto">
        <Link href="/players" className="text-sky-300 hover:underline">
          ← 回總表
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-black/30">
          <h1 className="text-4xl font-bold">{player.name}</h1>
          <p className="mt-2 text-slate-400">球員個人頁</p>

          <div className="mt-6 divide-y divide-slate-800">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[100px_1fr] gap-4 py-3 text-sm"
              >
                <div className="text-slate-400">{label}</div>
                <div className="font-medium text-white">
                  {String(value || "-")}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">基本數據</h2>

            <div className="overflow-x-auto rounded-2xl border border-slate-700">
                <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-800 text-slate-300">
                    <tr>
                    <th className="p-3 text-left">數據名稱</th>
                    <th className="p-3 text-left">數值</th>
                    </tr>
                </thead>

                <tbody>
                    {basicStats.map(([label, value]) => (
                    <tr
                        key={label}
                        className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                        <td className="p-3 text-slate-400">{label}</td>
                        <td className="p-3 font-medium text-white">
                        {String(value || "-")}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>

            <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">進階數據</h2>

            <div className="overflow-x-auto rounded-2xl border border-slate-700">
                <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-800 text-slate-300">
                    <tr>
                    <th className="p-3 text-left">數據名稱</th>
                    <th className="p-3 text-left">數值</th>
                    </tr>
                </thead>

                <tbody>
                    {advancedStats.map(([label, value]) => (
                    <tr
                        key={label}
                        className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                        <td className="p-3 text-slate-400">{label}</td>
                        <td className="p-3 font-medium text-white">
                        {String(value || "-")}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}