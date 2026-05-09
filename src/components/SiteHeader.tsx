"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type SiteHeaderProps = {
  subtitle?: string;
  showSearch?: boolean;
  playerNameOptions?: any[];
  rightSlot?: ReactNode;
};

type SearchCounts = Record<string, number>;

const SEARCH_COUNTS_KEY = "twds-search-counts-v1";

const NAV_ITEMS = [
  { href: "/", label: "TWDS", isBrand: true },
  { href: "/today", label: "今日出賽" },
  { href: "/players", label: "總表" },
  { href: "/calendar", label: "日曆" },
];

function getSearchCounts(): SearchCounts {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(SEARCH_COUNTS_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
}

function saveSearchCounts(counts: SearchCounts) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SEARCH_COUNTS_KEY, JSON.stringify(counts));
}

function SearchBox({ playerNameOptions }: { playerNameOptions: any[] }) {
  const [keyword, setKeyword] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [searchCounts, setSearchCounts] = useState<SearchCounts>({});

  useEffect(() => {
    setSearchCounts(getSearchCounts());
  }, []);

  function recordSearch(value: string) {
    const text = value.trim();

    if (!text) return;

    const nextCounts = {
      ...searchCounts,
      [text]: (searchCounts[text] || 0) + 1,
    };

    setSearchCounts(nextCounts);
    saveSearchCounts(nextCounts);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const text = keyword.trim();

    if (!text) {
      event.preventDefault();
      return;
    }

    recordSearch(text);
  }

  const matchedOptions = useMemo(() => {
    const text = keyword.trim().toLowerCase();

    const options = text
      ? playerNameOptions.filter((p) =>
          String(p?.name_zh ?? "").toLowerCase().includes(text)
        )
      : playerNameOptions;

    return options
      .sort((a, b) => {
        const countA = searchCounts[a] || 0;
        const countB = searchCounts[b] || 0;

        if (countA !== countB) {
          return countB - countA;
        }

        const aText = String(a?.name_zh ?? a ?? "");
        const bText = String(b?.name_zh ?? b ?? "");

        return aText.localeCompare(bText);
      })
      .slice(0, 8);
  }, [keyword, playerNameOptions, searchCounts]);

  return (
    <div className="relative w-full md:w-[300px]">
      <form action="/search" onSubmit={handleSubmit} className="flex w-full gap-2">
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
            <div className="absolute z-[9999] left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
              {matchedOptions.map((p) => (
                <button
                  key={p.name_zh}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    recordSearch(p.name_zh);
                    window.location.href = `/search?q=${encodeURIComponent(p.name_zh)}`;
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  {p.name_zh}
                </button>
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
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  let ordered = NAV_ITEMS;

  if (pathname.startsWith("/today")) {
    ordered = [NAV_ITEMS[1], NAV_ITEMS[0], NAV_ITEMS[2], NAV_ITEMS[3]];
  } else if (pathname.startsWith("/players")) {
    ordered = [NAV_ITEMS[2], NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[3]];
  } else if (pathname.startsWith("/calendar")) {
    ordered = [NAV_ITEMS[3], NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2]];
  } else {
    ordered = NAV_ITEMS;
  }

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-lg font-bold text-white hover:bg-slate-800">
        ☰
      </summary>

      <div className="absolute left-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
        {ordered.map((item, index) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={[
              "block px-4 py-3 hover:bg-slate-800",
              index === 0
                ? "text-2xl font-bold text-white border-b border-slate-700"
                : "text-sm text-slate-300",
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
    <header className="relative z-[9999] mb-4">
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <NavMenu />

          <nav className="flex items-center gap-4 text-sm font-bold text-slate-200">
            <Link href="/" className="hover:text-sky-300 transition">
              首頁
            </Link>

            <Link href="/today" className="hover:text-sky-300 transition">
              今日出賽
            </Link>

            <Link href="/players" className="hover:text-sky-300 transition">
              總表
            </Link>

            <Link href="/calendar" className="hover:text-sky-300 transition">
              日曆
            </Link>
          </nav>
        </div>

        {rightSlot ??
          (showSearch ? (
            <SearchBox playerNameOptions={playerNameOptions} />
          ) : null)}
      </div>
    </header>
  );
}