"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TodayReport = any;

type TodayTableProps = {
  todayPlayers: TodayReport[];
  allReports: TodayReport[];
};

const ALL = "全部";
const TYPE_OPTIONS = ["投手", "野手"];
const LEAGUE_OPTIONS = ["MLB", "MiLB", "NPB", "KBO", "美職", "日職", "韓職", "其他"];
const LEVEL_OPTIONS = ["MLB", "3A", "2A", "A+", "1A", "RK", "日職一軍", "日職二軍", "韓職一軍"];
const LEVEL_ORDER: Record<string, number> = {
  MLB: 1,
  "3A": 2,
  AAA: 2,
  "2A": 3,
  AA: 3,
  "A+": 4,
  "1A": 5,
  RK: 6,
  "日職一軍": 7,
  "日職二軍": 8,
  "韓職一軍": 9,
};

function levelRank(level: unknown) {
  return LEVEL_ORDER[String(level ?? "").trim()] ?? 999;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeSearchText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function parseMultiParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getPlayerName(report: TodayReport): string {
  return Array.isArray(report.players)
    ? normalizeText(report.players[0]?.name_zh)
    : normalizeText(report.players?.name_zh);
}

function getPlayerId(report: TodayReport): string {
  return normalizeText(report.player_id || report.players?.id);
}

function getPlayerLeague(report: TodayReport): string {
  if (Array.isArray(report.players)) {
    return normalizeText(report.players[0]?.league);
  }

  return normalizeText(report.players?.league || report.league);
}

function getPlayerLevel(report: TodayReport): string {
  if (Array.isArray(report.players)) {
    return normalizeText(report.players[0]?.level);
  }

  return normalizeText(report.players?.level || report.level);
}

function getPlayerTeam(report: TodayReport): string {
  if (Array.isArray(report.players)) {
    return normalizeText(
      report.players[0]?.team_name ||
      report.players[0]?.teams?.name_zh ||
      report.players[0]?.teams?.abbreviation
    );
  }

  return normalizeText(
    report.team ||
    report.team_name ||
    report.players?.team_name
  );
}

function formatDate(date: unknown): string {
  const text = normalizeText(date);
  if (!text) return "-";
  return text.slice(0, 10);
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeDivide(top: number, bottom: number): number | null {
  if (!bottom) return null;
  return top / bottom;
}

function formatRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(3).replace(/^0/, "");
}

function formatDecimal(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function ipToOuts(ipValue: unknown): number {
  const text = String(ipValue ?? "").trim();
  if (!text) return 0;

  const [wholeText, decimalText = "0"] = text.split(".");
  const whole = Number(wholeText);
  const decimal = Number(decimalText);

  if (!Number.isFinite(whole)) return 0;

  return whole * 3 + (decimal === 1 ? 1 : decimal === 2 ? 2 : 0);
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function hasBattingStats(report: TodayReport): boolean {
  return [
    report.ab,
    report.pa,
    report.r,
    report.h,
    report.rbi,
    report.bb,
    report.k,
    report.hr,
    report.doubles,
    report.triples,
    report.sb,
    report.hbp,
    report.sf,
  ].some(hasValue);
}

function hasPitchingStats(report: TodayReport): boolean {
  return [
    report.ip,
    report.er,
    report.bf,
    report.pitch_count,
  ].some(hasValue);
}

function getStats(report: TodayReport, allReports: TodayReport[] = []): string {
  if (hasPitchingStats(report)) {
    const ipOuts = ipToOuts(report.ip);
    const ip = ipOuts / 3;

    const h = toNumber(report.h);
    const hr = toNumber(report.hr);
    const k = toNumber(report.k);
    const bb = toNumber(report.bb);
    const er = toNumber(report.er);

    const era = safeDivide(er * 9, ip);
    const whip = safeDivide(h + bb, ip);

    return [
      `IP ${report.ip ?? 0}`,
      `投球數 ${report.pitch_count ?? 0}`,
      `${h}H`,
      `${hr}HR`,
      `${k}K`,
      `${bb}BB`,
      `ERA ${formatDecimal(era)}`,
      `WHIP ${formatDecimal(whip)}`,
    ].join(" | ");
  }

  if (hasBattingStats(report)) {
    const ab = toNumber(report.ab);
    const pa = toNumber(report.pa);
    const h = toNumber(report.h);
    const hr = toNumber(report.hr);
    const k = toNumber(report.k);
    const bb = toNumber(report.bb);
    const doubles = toNumber(report.doubles);
    const triples = toNumber(report.triples);

    const singles = h - doubles - triples - hr;
    const tb = singles + doubles * 2 + triples * 3 + hr * 4;

    const avg = safeDivide(h, ab);
    const obp = safeDivide(
      h + bb + toNumber(report.hbp),
      pa
    );
    const slg = safeDivide(tb, ab);
    const ops = obp === null && slg === null ? null : (obp ?? 0) + (slg ?? 0);

    return [
      `AB ${ab}`,
      `PA ${pa}`,
      `H ${h}`,
      `HR ${hr}`,
      `K ${k}`,
      `BB ${bb}`,
      `AVG ${formatRate(avg)}`,
      `OPS ${formatRate(ops)}`,
    ].join(" | ");
  }

  return "-";
}
function isPitcher(report: TodayReport): boolean {
  const type = normalizeText(report.position).toLowerCase();
  return type.includes("投") || type.includes("pitcher") || type === "p";
}

function isHitter(report: TodayReport): boolean {
  const type = normalizeText(report.position).toLowerCase();
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
    formatDate(report.report_date),
    getPlayerName(report),
    report.position,
    getPlayerLeague(report),
    getPlayerTeam(report),
    getPlayerLevel(report),
    report.result,
    report.opponent,
    getStats(report),
  ]
    .map(normalizeSearchText)
    .join(" ");

  return searchableText.includes(keyword);
}

function matchesDate(report: TodayReport, dateFilter: string): boolean {
  if (dateFilter === ALL) return true;
  return formatDate(report.report_date) === dateFilter;
}

function matchesType(report: TodayReport, selectedTypes: string[]): boolean {
  if (selectedTypes.length === 0) return true;

  return (
    (selectedTypes.includes("投手") && isPitcher(report)) ||
    (selectedTypes.includes("野手") && isHitter(report))
  );
}

function matchesLeague(report: TodayReport, selectedLeagues: string[]): boolean {
  if (selectedLeagues.length === 0) return true;
  return selectedLeagues.includes(getPlayerLeague(report));
}

function matchesLevel(report: TodayReport, selectedLevels: string[]): boolean {
  if (selectedLevels.length === 0) return true;
  return selectedLevels.includes(getPlayerLevel(report));
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
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

export default function TodayTable({ todayPlayers, allReports }: TodayTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const availableDates = useMemo(() => {
    return Array.from(
      new Set(todayPlayers.map((report) => formatDate(report.report_date)).filter((date) => date !== "-"))
    ).sort((a, b) => String(b).localeCompare(String(a)));
  }, [todayPlayers]);

  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || ALL);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(parseMultiParam(searchParams.get("type")));
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(parseMultiParam(searchParams.get("league")));
  const [selectedLevels, setSelectedLevels] = useState<string[]>(parseMultiParam(searchParams.get("level")));

  function applyFilters() {
    const params = new URLSearchParams();

    if (searchText.trim()) params.set("q", searchText.trim());
    if (dateFilter !== ALL) params.set("date", dateFilter);
    if (selectedTypes.length > 0) params.set("type", selectedTypes.join(","));
    if (selectedLeagues.length > 0) params.set("league", selectedLeagues.join(","));
    if (selectedLevels.length > 0) params.set("level", selectedLevels.join(","));

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

    router.replace(defaultDate !== ALL ? `/today?date=${defaultDate}` : "/today", {
      scroll: false,
    });
  }

  const filteredTodayPlayers = useMemo(() => {
    const keyword = normalizeSearchText(searchText);

    return todayPlayers
      .filter((report) => {
        return (
          getStats(report) !== "-" &&
          matchesSearch(report, keyword) &&
          matchesDate(report, dateFilter) &&
          matchesType(report, selectedTypes) &&
          matchesLeague(report, selectedLeagues) &&
          matchesLevel(report, selectedLevels)
        );
      })
      .sort((a, b) => {
        return levelRank(getPlayerLevel(a)) - levelRank(getPlayerLevel(b));
      });
  }, [todayPlayers, searchText, dateFilter, selectedTypes, selectedLeagues, selectedLevels]);

  function exportTodayCsv() {
    const headers = ["日期", "球員", "守位", "聯盟", "球隊", "層級", "結果", "對手", "成績"];

    const rows = filteredTodayPlayers.map((report) => [
      formatDate(report.report_date),
      getPlayerName(report),
      report.position,
      getPlayerLeague(report),
      getPlayerTeam(report),
      getPlayerLevel(report),
      report.result,
      report.opponent,
      getStats(report),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TWDS_球員出賽紀錄篩選結果.csv";
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
          <label className="block">
            <p className="text-slate-400 text-sm mb-2">日期</p>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            >
              {[ALL, ...availableDates].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <p className="text-slate-400 text-sm mb-2">搜尋</p>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜尋球員、球隊、對手、成績、層級..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white placeholder:text-slate-500"
            />
          </label>

          <CheckboxGroup title="類型" options={TYPE_OPTIONS} values={selectedTypes} onChange={setSelectedTypes} />
          <CheckboxGroup title="聯盟" options={LEAGUE_OPTIONS} values={selectedLeagues} onChange={setSelectedLeagues} />
          <CheckboxGroup title="層級" options={LEVEL_OPTIONS} values={selectedLevels} onChange={setSelectedLevels} />

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={applyFilters} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 transition">
              套用篩選
            </button>

            <button type="button" onClick={clearFilters} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition">
              清除篩選
            </button>

            <button type="button" onClick={exportTodayCsv} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition">
              匯出目前結果 CSV
            </button>
          </div>
        </div>
      </details>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl shadow-black/30">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-3xl font-bold">球員出賽紀錄</h2>
          <p className="text-slate-400 text-sm mt-1">
            出賽球員：{filteredTodayPlayers.length} 人
          </p>
        </div>

        <div className="max-h-[calc(100vh-260px)] overflow-auto overscroll-contain touch-pan-x">
          <table className="w-full min-w-[1150px] border-separate border-spacing-0 text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-50 bg-slate-800 text-slate-300">
              <tr>
                <th className="sticky left-0 top-0 z-[70] bg-slate-800 text-right p-3 shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-700">
                  球員
                </th>
                <th className="bg-slate-800 text-left p-3">日期</th>
                <th className="bg-slate-800 text-left p-3">守位</th>
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
                  <td colSpan={9} className="p-8 text-center text-slate-400 border-t border-slate-800">
                    找不到符合條件的出賽紀錄
                  </td>
                </tr>
              ) : (
                filteredTodayPlayers.map((report, index) => {
                  const name = getPlayerName(report) || "-";
                  const playerId = getPlayerId(report);
                  const safeId = playerId && playerId !== "undefined" ? playerId : null;

                  return (
                    <tr key={`${report.id || name}-${index}`} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="sticky left-0 z-30 bg-slate-900 p-3 text-right font-bold shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                        <Link
                          href={safeId ? `/players/${encodeURIComponent(safeId)}` : "#"}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {name}
                        </Link>
                      </td>

                      <td className="p-3 text-left">{formatDate(report.report_date)}</td>
                      <td className="p-3 text-left">{normalizeText(report.position) || "-"}</td>
                      <td className="p-3 text-left">{getPlayerLeague(report) || "-"}</td>
                      <td className="p-3 text-left">{getPlayerTeam(report) || "-"}</td>
                      <td className="p-3 text-left">{getPlayerLevel(report) || "-"}</td>

                      <td className="p-3 text-left">
                        {normalizeText(report.result) || "-"}
                      </td>

                      <td className="p-3 text-left">{normalizeText(report.opponent) || "-"}</td>
                      <td className="p-3 text-left whitespace-normal min-w-[360px]">
                        {getStats(report, allReports)}
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