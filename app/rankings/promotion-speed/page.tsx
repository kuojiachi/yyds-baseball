import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import SiteHeader from "../../../src/components/SiteHeader";
type RankingRow = {
  ranking: number;
  player_id: string;
  name_zh: string;
  name_en: string | null;
  league: string | null;
  current_level: string | null;
  reached_date: string | null;
  career_start_date: string | null;
  career_start_level: string | null;
  target_level: string;
  days_to_target: number | null;
};


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TARGET_LEVELS = ["1A", "A+", "2A", "3A", "MLB"];

async function getPromotionSpeedRankings() {
  const { data, error } = await supabase
    .from("promotion_speed_rankings")
    .select("*")
    .order("target_level", { ascending: true })
    .order("ranking", { ascending: true });

  if (error) {
    console.error("getPromotionSpeedRankings error:", error.message);
    return [];
  }

  return data as RankingRow[];
}

export default async function PromotionSpeedRankingPage({
  searchParams,
}: {
  searchParams?: Promise<{ level?: string }>;
}) {
  const params = await searchParams;
  const selectedLevel = TARGET_LEVELS.includes(params?.level ?? "")
    ? params?.level
    : "1A";

  const rows = await getPromotionSpeedRankings();
  const filteredRows = rows.filter((row) => row.target_level === selectedLevel);

  return (
    <>
    <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 text-slate-100">
        <div className="mb-6">
          <Link
            href="/rankings"
            className="mb-3 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            ← 回排行榜
          </Link>

          <h1 className="text-2xl font-bold">飛升速度排行榜</h1>
          <p className="mt-1 text-sm text-slate-400">
            比較球員從職業生涯起點到各層級所花費的天數
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {TARGET_LEVELS.map((level) => {
            const active = selectedLevel === level;

            return (
              <Link
                key={level}
                href={`/rankings/promotion-speed?level=${encodeURIComponent(
                  level
                )}`}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-bold transition",
                  active
                    ? "border-sky-400 bg-sky-500 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-500 hover:text-white",
                ].join(" ")}
              >
                {level} 飛升榜
              </Link>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">排名</th>
                <th className="px-4 py-3 text-left">球員</th>
                <th className="px-4 py-3 text-left">聯盟</th>
                <th className="px-4 py-3 text-left">目標層級</th>
                <th className="px-4 py-3 text-left">起始日</th>
                <th className="px-4 py-3 text-left">起始層級</th>
                <th className="px-4 py-3 text-left">到達日</th>
                <th className="px-4 py-3 text-right">花費天數</th>
                <th className="px-4 py-3 text-left">目前層級</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={`${row.player_id}-${row.target_level}`}
                  className="border-t border-slate-800 text-slate-100"
                >
                  <td className="px-4 py-3 font-bold">#{row.ranking}</td>

                  <td className="px-4 py-3">
                    
                    <Link
                      href={`/players/${row.player_id}`}
                      className="font-medium text-white hover:text-sky-300"
                    >
                      {row.name_zh}
                    </Link>

                    {row.name_en ? (
                      <div className="text-xs text-slate-400">{row.name_en}</div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">{row.league ?? "-"}</td>
                  <td className="px-4 py-3 font-bold">{row.target_level}</td>
                  <td className="px-4 py-3">{row.career_start_date ?? "-"}</td>
                  <td className="px-4 py-3">{row.career_start_level ?? "-"}</td>

                  <td className="px-4 py-3">{row.reached_date ?? "-"}</td>

                  <td className="px-4 py-3 text-right font-bold">
                    {typeof row.days_to_target === "number"
                      ? `${row.days_to_target} 天`
                      : "-"}
                  </td>

                  <td className="px-4 py-3">{row.current_level ?? "-"}</td>
                </tr>
              ))}

              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    尚無 {selectedLevel} 飛升榜資料
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}