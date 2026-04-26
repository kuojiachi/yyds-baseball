"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  subtitle?: string;
  showSearch?: boolean;
  playerNameOptions?: string[];
  rightSlot?: ReactNode;
};

const NAV_ITEMS = [
  { href: "/", label: "TWDS", isBrand: true },
  { href: "/today", label: "今日出賽" },
  { href: "/players", label: "總表" },
];

function SearchBox({ playerNameOptions }: { playerNameOptions: string[] }) {
  const [keyword, setKeyword] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const matchedOptions = useMemo(() => {
    const text = keyword.trim().toLowerCase();

    if (!text) return [];

    return playerNameOptions
      .filter((name) => name.toLowerCase().includes(text))
      .slice(0, 8);
  }, [keyword, playerNameOptions]);

  return (
    <div className="relative w-full md:w-[300px]">
      <form action="/search" className="flex w-full gap-2">
        <div className="relative flex-1">
          <input
            name="q"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 120);
            }}
            placeholder="搜尋球員..."
            autoComplete="off"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />

          {isFocused && matchedOptions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
              {matchedOptions.map((name) => (
                <Link
                  key={name}
                  href={`/search?q=${encodeURIComponent(name)}`}
                  className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  {name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          className="shrink-0 rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-500 transition"
        >
          搜尋
        </button>
      </form>
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
              "block px-4 py-3 hover:bg-slate-800",
              item.isBrand
                ? "border-b-2 border-slate-600 text-4xl font-bold text-white tracking-wide"
                : "text-sm text-slate-200",
              index > 1 ? "border-t border-slate-800" : "",
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
  showSearch = true,
  playerNameOptions = [],
  rightSlot,
}: SiteHeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex items-center gap-3">
        <NavMenu />
      </div>

      {rightSlot ??
        (showSearch ? (
          <SearchBox playerNameOptions={playerNameOptions} />
        ) : null)}
    </header>
  );
}