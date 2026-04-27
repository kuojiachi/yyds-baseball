"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { TodayReport } from "@/src/lib/excel";

type TodayTableProps = {
  todayPlayers: TodayReport[];
};

const ALL = "全部";

const TYPE_OPTIONS = ["投手", "野手"];
const LEAGUE_OPTIONS = ["MLB", "MiLB", "NPB", "KBO", "其他"];
const LEVEL_OPTIONS = [
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

function parseMultiParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPitcher(report: TodayReport): boolean {
  const type = normalizeText(report.type).toLowerCase();

  return type.includes("投") || type.includes("pitcher") || type === "p";
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

function matchesType(report: TodayReport, selectedTypes: string[]): boolean {
  if (selectedTypes.length === 0) return true;

  return (
    (selectedTypes.includes("投手") && isPitcher(report)) ||
    (selectedTypes.includes("野手") && isHitter(report))
  );
}

function matchesLeague(
  report: TodayReport,
  selectedLeagues: string[]
): boolean {
  if (selectedLeagues.length === 0) return true;

  return selectedLeagues.includes(normalizeText(report.league));
}

function matchesLevel(report: TodayReport, selectedLevels: string[]): boolean {
  if (selectedLevels.length === 0) return true;

  return selectedLevels.includes(normalizeText(report.level));
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toggleValue(values: string[], value: string): string[] {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

function CheckboxGroup({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-slate-400 text-sm mb-2">{title}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = values.includes(option);

          return (
            <label
              key={option}
              className={[
                "cursor-pointer rounded-lg border px-3 py-2 text-sm transition",
                checked
                  ? "border-sky-500 bg-sky-500/20 text-sky-200"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleValue(values, option))}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    parseMultiParam(searchParams.get("type"))
  );
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(
    parseMultiParam(searchParams.get("league"))
  );
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    parseMultiParam(searchParams.get("level"))
  );

  function applyFilters() {
    const params = new URLSearchParams();

    if (searchText.trim()) {
      params.set("q", searchText.trim());
    }

    if (dateFilter !== ALL) {
      params.set("date", dateFilter);
    }

    if (selectedTypes.length > 0) {
      params.set("type", selectedTypes.join(","));
    }

    if (selectedLeagues.length > 0) {
      params.set("league", selectedLeagues.join(","));
    }

    if (selectedLevels.length > 0) {
      params.set("level", selectedLevels.join(","));
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
    setSelectedTypes([]);
    setSelectedLeagues([]);
    setSelectedLevels([]);

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
        matchesType(report, selectedTypes) &&
        matchesLeague(report, selectedLeagues) &&
        matchesLevel(report, selectedLevels)
      );
    });
  }, [
    todayPlayers,
    searchText,
    dateFilter,
    selectedTypes,
    selectedLeagues,
    selectedLevels,
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
      <details className="bg-slate-900 rounded-2xl border border-slate-800 mb-6 p-5">
        <summary className="list-none cursor-pointer inline-flex w-fit items-center rounded border border-slate-700 px-1.5 py-0 text-xs leading-5 text-slate-300 hover:bg-slate-800">
          篩選條件
        </summary>

        <div className="mt-5 space-y-5">
          <FilterSelect
            label="日期"
            value={dateFilter}
            options={[ALL, ...availableDates]}
            onChange={setDateFilter}
          />

          <label className="block">
            <p className="text-slate-400 text-sm mb-2">搜尋</p>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜尋球員、球隊、對手、成績、層級..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white placeholder:text-slate-500"
            />
          </label>

          <CheckboxGroup
            title="類型"
            options={TYPE_OPTIONS}
            values={selectedTypes}
            onChange={setSelectedTypes}
          />

          <CheckboxGroup
            title="聯盟"
            options={LEAGUE_OPTIONS}
            values={selectedLeagues}
            onChange={setSelectedLeagues}
          />

          <CheckboxGroup
            title="層級"
            options={LEVEL_OPTIONS}
            values={selectedLevels}
            onChange={setSelectedLevels}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 transition"
            >
              套用篩選
            </button>

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
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition"
            >
              匯出目前結果 CSV
            </button>
          </div>
        </div>
      </details>

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
                      <td className="sticky left-0 z-30 bg-slate-900 p-3 font-bold shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                        <Link
                          href={`/players/${encodeURIComponent(
                            report.id || name
                          )}`}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {name}
                        </Link>
                      </td>
                      <td className="p-3">
                        {normalizeText(report.date) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(report.type) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(report.league) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(report.team) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(report.level) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(report.result) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(report.opponent) || "-"}
                      </td>
                      <td className="p-3 whitespace-normal min-w-[360px]">
                        {normalizeText(report.stats) || "-"}
                      </td>
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