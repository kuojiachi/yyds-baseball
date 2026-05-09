import Link from "next/link";
import SiteHeader from "@/src/components/SiteHeader";
import { supabase } from "@/src/lib/supabase";

type RankingRow = {
  ranking: number;
  player_id: string;
  name_zh: string;
  name_en: string | null;
  league: string | null;
  current_level: string | null;
  career_start_level: string | null;
  career_start_date: string | null;
  target_level: string;
  reached_date: string;
  reached_age_days: number;
};

const LEVELS = ["1A", "A+", "2A", "3A", "MLB"];

function formatAge(days: number) {
  const years = Math.floor(days / 365.2425);
  const remainingDays = Math.floor(days - years * 365.2425);
  return `${years}歲${remainingDays}天`;
}

export default async function YoungestPromotionRankingPage({
  searchParams,
}: {
  searchParams?: Promise<{ level?: string }>;
}) {
  const params = await searchParams;

  const selectedLevel = LEVELS.includes(params?.level ?? "")
    ? params?.level
    : "1A";

  const { data, error } = await supabase
    .from("youngest_promotion_rankings")
    .select(
      `
      ranking,
      player_id,
      name_zh,
      name_en,
      league,
      current_level,
      career_start_level,
      career_start_date,
      target_level,
      reached_date,
      reached_age_days
    `
    )
    .eq("target_level", selectedLevel)
    .order("ranking", { ascending: true });

  const rows = (data ?? []) as RankingRow[];

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-bold">各層級年齡最小晉升榜</h1>
          <p className="mt-4 text-red-300">讀取資料失敗：{error.message}</p>
        </section>
      </main>
    );
  }

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

          <h1 className="text-3xl font-black tracking-tight">
            各層級年齡最小晉升榜
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            比較球員首次到達各層級時的年齡，年齡越小排名越前。
          </p>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          {LEVELS.map((level) => (
            <Link
              key={level}
              href={{
                pathname: "/rankings/youngest-promotion",
                query: { level },
              }}
              className={`rounded-full border px-5 py-2 text-sm font-bold transition ${
                selectedLevel === level
                  ? "border-sky-400 bg-sky-500 text-white"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400"
              }`}
            >
              {level} 最年輕榜
            </Link>
          ))}
        </div>

        <div className="max-h-[75vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-slate-800 text-slate-300">
              <tr>
                <th className="w-16 px-4 py-3 text-left">排名</th>
                <th className="sticky left-0 z-30 min-w-[190px] whitespace-nowrap bg-slate-800 px-4 py-3 text-left">
                  球員
                </th>
                <th className="w-28 px-4 py-3 text-left">聯盟</th>
                <th className="w-28 px-4 py-3 text-left">目標層級</th>
                <th className="w-32 px-4 py-3 text-left">晉升日</th>
                <th className="w-32 px-4 py-3 text-right">晉升年齡</th>
                <th className="w-32 px-4 py-3 text-left">起始層級</th>
                <th className="w-32 px-4 py-3 text-left">起始日</th>
                <th className="w-32 px-4 py-3 text-left">目前層級</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    目前沒有資料。
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.player_id}-${row.target_level}`}
                    className="border-t border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-bold text-slate-300">
                      #{row.ranking}
                    </td>

                    <td className="sticky left-0 z-10 min-w-[190px] whitespace-nowrap bg-slate-900 px-4 py-3 font-bold">
                      <Link
                        href={`/players/${row.player_id}`}
                        className="text-sky-300 hover:text-sky-200 hover:underline"
                      >
                        {row.name_zh}
                      </Link>
                      {row.name_en ? (
                        <div className="mt-0.5 text-xs font-normal text-sky-200/80">
                          {row.name_en}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.league ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {row.target_level}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.reached_date}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-amber-300">
                      {formatAge(row.reached_age_days)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.career_start_level ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.career_start_date ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.current_level ?? "-"}
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