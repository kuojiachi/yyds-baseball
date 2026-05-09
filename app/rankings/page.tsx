import Link from "next/link";
import SiteHeader from "../../src/components/SiteHeader";

const rankingItems = [
  {
    href: "/rankings/promotion-speed",
    title: "最快飛升排行榜",
    description: "比較球員從職業生涯起點到各層級所花費的天數",
  },
  {
  href: "/rankings/youngest-promotion",
  title: "最年輕飛升排行榜",
  description: "比較球員首次到達各層級時的年齡",
  },
  {
    href: "/rankings/injury",
    title: "痛痛人排行榜",
    description: "統計球員傷兵次數、總天數與痛痛值",
  },
  {
    href: "/rankings/journeyman",
    title: "浪人排行榜",
    description: "依效力球隊數與異動次數統計旅外球員流動程度",
  }
];

export default function RankingsPage() {
  return (
    <>
      <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold text-white">排行榜</h1>
        <p className="mt-1 text-sm text-slate-400">
          查看旅外球員各類特殊排行榜
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rankingItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-sky-500 hover:bg-slate-800"
            >
              <div className="text-lg font-bold text-white">{item.title}</div>
              <div className="mt-2 text-sm text-slate-400">
                {item.description}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>    
  );
}