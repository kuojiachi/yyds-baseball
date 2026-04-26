import Link from "next/link";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  subtitle?: string;
  showSearch?: boolean;
  playerNameOptions?: string[];
  rightSlot?: ReactNode;
};

const NAV_ITEMS = [
  { href: "/", label: "首頁" },
  { href: "/today", label: "今日出賽" },
  { href: "/players", label: "總表" },
];

function SearchBox({ playerNameOptions }: { playerNameOptions: string[] }) {
  return (
    <div className="w-full md:w-[380px]">
      <form action="/search" className="flex w-full gap-2">
        <input
          name="q"
          type="search"
          list="twds-player-search-options"
          placeholder="搜尋球員、球隊、層級..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />

        <datalist id="twds-player-search-options">
          {playerNameOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white hover:bg-sky-500 transition"
        >
          搜尋
        </button>
      </form>

      <p className="mt-2 text-right text-xs text-slate-500">
        完整球員名會直接進個人頁
      </p>
    </div>
  );
}

function NavMenu() {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xl font-bold text-white hover:bg-slate-800">
        ☰
      </summary>

      <div className="absolute left-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
        {NAV_ITEMS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800",
              index > 0 ? "border-t border-slate-800" : "",
            ].join(" ")}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export default function SiteHeader({
  subtitle,
  showSearch = true,
  playerNameOptions = [],
  rightSlot,
}: SiteHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-center gap-3">
        <NavMenu />

        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-bold hover:text-sky-300 transition">
            TWDS
          </h1>

          {subtitle ? <p className="mt-2 text-slate-300">{subtitle}</p> : null}
        </Link>
      </div>

      {rightSlot ??
        (showSearch ? (
          <SearchBox playerNameOptions={playerNameOptions} />
        ) : null)}
    </header>
  );
}