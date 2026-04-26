"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { TodayReport } from "@/src/lib/excel";

type TodayTableProps = {
  todayPlayers: TodayReport[];
};

const ALL = "全部";

const TYPE_OPTIONS = [ALL, "投手", "野手"];
const LEAGUE_OPTIONS = [ALL, "MLB", "MiLB", "NPB", "KBO", "其他"];
const LEVEL_OPTIONS = [
  ALL,
  "MLB",
  "3A",
  "2A",
  "A+",
  "1A",
  "RK",
  "日職一軍",
  "日職二軍",
  "韓職一軍",
];

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeSearchText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function isPitcher(report: TodayReport): boolean {
  const type = normalizeText(report.type).toLowerCase();

  return (
    type.includes("投") ||
    type.includes("pitcher") ||
    type === "p"
  );
}

function isHitter(report: TodayReport): boolean {
  const type = normalizeText(report.type).toLowerCase();

  return (
    type.includes("野") ||
    type.includes("外") ||
    type.includes("內") ||
    type.includes("捕") ||
    type.includes("打") ||
    type.includes("hitter") ||
    type.includes("batter") ||
    type === "h"
  );
}

function matchesSearch(report: TodayReport, keyword: string): boolean {
  if (!keyword) return true;

  const searchableText = [
    report.date,
    report.name,
    report.type,
    report.league,
    report.team,
    report.level,
    report.result,
    report.opponent,
    report.stats,
  ]
    .map(normalizeSearchText)
    .join(" ");

  return searchableText.includes(keyword);
}

function matchesDate(report: TodayReport, dateFilter: string): boolean {
  if (dateFilter === ALL) return true;

  return normalizeText(report.date) === dateFilter;
}

function matchesType(report: TodayReport, typeFilter: string): boolean {
  if (typeFilter === ALL) return true;
  if (typeFilter === "投手") return isPitcher(report);
  if (typeFilter === "野手") return isHitter(report);

  return true;
}

function matchesLeague(report: TodayReport, leagueFilter: string): boolean {
  if (leagueFilter === ALL) return true;

  return normalizeText(report.league) === leagueFilter;
}

function matchesLevel(report: TodayReport, levelFilter: string): boolean {
  if (levelFilter === ALL) return true;

  return normalizeText(report.level) === levelFilter;
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function TodayTable({ todayPlayers }: TodayTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const availableDates = useMemo(() => {
    return Array.from(
      new Set(todayPlayers.map((report) => report.date).filter(Boolean))
    ).sort((a, b) => b.localeCompare(a));
  }, [todayPlayers]);

  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || availableDates[0] || ALL
  );
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || ALL);
  const [leagueFilter, setLeagueFilter] = useState(
    searchParams.get("league") || ALL
  );
  const [levelFilter, setLevelFilter] = useState(
    searchParams.get("level") || ALL
  );

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const nextValue = value.trim();

    if (nextValue === "" || nextValue === ALL) {
      params.delete(key);
    } else {
      params.set(key, nextValue);
    }

    const queryString = params.toString();

    router.replace(queryString ? `/today?${queryString}` : "/today", {
      scroll: false,
    });
  }

  function clearFilters() {
    const defaultDate = availableDates[0] || ALL;

    setSearchText("");
    setDateFilter(defaultDate);
    setTypeFilter(ALL);
    setLeagueFilter(ALL);
    setLevelFilter(ALL);

    const params = new URLSearchParams();

    if (defaultDate !== ALL) {
      params.set("date", defaultDate);
    }

    const queryString = params.toString();

    router.replace(queryString ? `/today?${queryString}` : "/today", {
      scroll: false,
    });
  }

  const filteredTodayPlayers = useMemo(() => {
    const keyword = normalizeSearchText(searchText);

    return todayPlayers.filter((report) => {
      return (
        matchesSearch(report, keyword) &&
        matchesDate(report, dateFilter) &&
        matchesType(report, typeFilter) &&
        matchesLeague(report, leagueFilter) &&
        matchesLevel(report, levelFilter)
      );
    });
  }, [
    todayPlayers,
    searchText,
    dateFilter,
    typeFilter,
    leagueFilter,
    levelFilter,
  ]);

  function exportTodayCsv() {
    const headers = [
      "日期",
      "球員",
      "類型",
      "聯盟",
      "球隊",
      "層級",
      "結果",
      "對手",
      "成績",
    ];

    const rows = filteredTodayPlayers.map((report) => [
      report.date,
      report.name,
      report.type,
      report.league,
      report.team,
      report.level,
      report.result,
      report.opponent,
      report.stats,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TWDS_今日戰報篩選結果.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 mb-6 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">篩選條件</h2>
            <p className="text-slate-400 text-sm mt-1">
              可搜尋球員、球隊、對手、成績、層級
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition"
            >
              清除篩選
            </button>

            <button
              type="button"
              onClick={exportTodayCsv}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 transition"
            >
              匯出目前結果 CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <FilterSelect
            label="日期"
            value={dateFilter}
            options={[ALL, ...availableDates]}
            onChange={(value) => {
              setDateFilter(value);
              updateFilter("date", value);
            }}
          />

          <label className="block">
            <p className="text-slate-400 text-sm mb-2">搜尋</p>
            <input
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                updateFilter("q", event.target.value);
              }}
              placeholder="搜尋球員、球隊、對手、成績、層級..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterSelect
            label="類型"
            value={typeFilter}
            options={TYPE_OPTIONS}
            onChange={(value) => {
              setTypeFilter(value);
              updateFilter("type", value);
            }}
          />

          <FilterSelect
            label="聯盟"
            value={leagueFilter}
            options={LEAGUE_OPTIONS}
            onChange={(value) => {
              setLeagueFilter(value);
              updateFilter("league", value);
            }}
          />

          <FilterSelect
            label="層級"
            value={levelFilter}
            options={LEVEL_OPTIONS}
            onChange={(value) => {
              setLevelFilter(value);
              updateFilter("level", value);
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold">今日戰報</h2>
          <p className="text-slate-400 text-sm mt-1">
            目前顯示：{filteredTodayPlayers.length} / {todayPlayers.length}
          </p>
        </div>

        <div className="max-h-[calc(100vh-260px)] overflow-auto overscroll-contain">
          <table className="w-full min-w-[1150px] border-separate border-spacing-0 text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-50 bg-slate-800 text-slate-300">
              <tr>
                <th className="sticky left-0 top-0 z-[70] bg-slate-800 text-left p-3 shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-700">
                  球員
                </th>
                <th className="bg-slate-800 text-left p-3">日期</th>
                <th className="bg-slate-800 text-left p-3">類型</th>
                <th className="bg-slate-800 text-left p-3">聯盟</th>
                <th className="bg-slate-800 text-left p-3">球隊</th>
                <th className="bg-slate-800 text-left p-3">層級</th>
                <th className="bg-slate-800 text-left p-3">結果</th>
                <th className="bg-slate-800 text-left p-3">對手</th>
                <th className="bg-slate-800 text-left p-3">成績</th>
              </tr>
            </thead>

            <tbody>
              {filteredTodayPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-slate-400 border-t border-slate-800"
                  >
                    找不到符合條件的今日戰報
                  </td>
                </tr>
              ) : (
                filteredTodayPlayers.map((report, index) => {
                  const name = normalizeText(report.name) || "-";

                  return (
                    <tr
                      key={`${name}-${index}`}
                      className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="sticky left-0 z-30 bg-slate-900 p-3 font-medium shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                        <Link
                          href={`/players/${encodeURIComponent(name)}`}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {name}
                        </Link>
                      </td>
                      <td className="p-3">{normalizeText(report.date) || "-"}</td>
                      <td className="p-3">{normalizeText(report.type) || "-"}</td>
                      <td className="p-3">{normalizeText(report.league) || "-"}</td>
                      <td className="p-3">{normalizeText(report.team) || "-"}</td>
                      <td className="p-3">{normalizeText(report.level) || "-"}</td>
                      <td className="p-3">{normalizeText(report.result) || "-"}</td>
                      <td className="p-3">
                        {normalizeText(report.opponent) || "-"}
                      </td>
                      <td className="p-3">{normalizeText(report.stats) || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}