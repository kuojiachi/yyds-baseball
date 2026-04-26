"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Player } from "@/src/lib/excel";
import { getMovementClass, getStatusClass } from "@/src/utils/playerStyles";
import { sortPlayersForTable } from "@/src/utils/sortPlayers";

type PlayersTableProps = {
  players: Player[];
};

const ALL = "全部";

const TYPE_OPTIONS = [ALL, "投手", "野手"];
const LEAGUE_OPTIONS = [ALL, "美職", "日職", "韓職", "台裔", "其他"];
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
const STATUS_OPTIONS = [ALL, "現役", "傷兵", "異動"];

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeSearchText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizePlayerType(type: unknown): string {
  return normalizeText(type).replace(/\s/g, "").replace(/　/g, "");
}

function normalizeLeague(league: unknown): string {
  const text = normalizeText(league);

  if (text === "旅美" || text === "MLB" || text === "MiLB") return "美職";
  if (text === "旅日" || text === "NPB") return "日職";
  if (text === "旅韓" || text === "KBO") return "韓職";

  return text || "其他";
}

function hasValue(value: unknown): boolean {
  const text = normalizeText(value);
  return text !== "" && text !== "-";
}

function isPitcher(player: Player): boolean {
  const type = normalizePlayerType(player.type);
  const lowerType = type.toLowerCase();

  return (
    type.includes("投手") ||
    lowerType.includes("pitcher") ||
    lowerType === "p"
  );
}

function isHitter(player: Player): boolean {
  const type = normalizePlayerType(player.type);
  const lowerType = type.toLowerCase();

  return (
    type.includes("外野手") ||
    type.includes("內野手") ||
    type.includes("野手") ||
    type.includes("捕手") ||
    type.includes("打者") ||
    lowerType.includes("hitter") ||
    lowerType.includes("batter") ||
    lowerType === "h"
  );
}

function matchesSearch(player: Player, keyword: string): boolean {
  if (!keyword) return true;

  const searchableText = [
    player.name,
    player.team,
    player.level,
    player.league,
    player.type,
    player.status,
    player.note,
  ]
    .map(normalizeSearchText)
    .join(" ");

  return searchableText.includes(keyword);
}

function matchesType(player: Player, typeFilter: string): boolean {
  if (typeFilter === ALL) return true;
  if (typeFilter === "投手") return isPitcher(player);
  if (typeFilter === "野手") return isHitter(player);

  return true;
}

function matchesLeague(player: Player, leagueFilter: string): boolean {
  if (leagueFilter === ALL) return true;

  return normalizeLeague(player.league) === leagueFilter;
}

function matchesLevel(player: Player, levelFilter: string): boolean {
  if (levelFilter === ALL) return true;

  return normalizeText(player.level) === levelFilter;
}

function matchesStatus(player: Player, statusFilter: string): boolean {
  if (statusFilter === ALL) return true;

  const status = normalizeText(player.status);
  const statusText = `${normalizeText(player.status)} ${normalizeText(player.note)}`;

  if (statusFilter === "現役") return status === "現役";
  if (statusFilter === "傷兵") return statusText.includes("傷");
  if (statusFilter === "異動") {
    return hasValue(player.movement) || hasValue(player.note);
  }

  return true;
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

export default function PlayersTable({ players }: PlayersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || ALL);
  const [leagueFilter, setLeagueFilter] = useState(
    searchParams.get("league") || ALL
  );
  const [levelFilter, setLevelFilter] = useState(
    searchParams.get("level") || ALL
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || ALL
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

    router.replace(queryString ? `/players?${queryString}` : "/players", {
      scroll: false,
    });
  }

  function clearFilters() {
    setSearchText("");
    setTypeFilter(ALL);
    setLeagueFilter(ALL);
    setLevelFilter(ALL);
    setStatusFilter(ALL);

    router.replace("/players", { scroll: false });
  }

  const filteredPlayers = useMemo(() => {
    const keyword = normalizeSearchText(searchText);

    return sortPlayersForTable(
      players.filter((player) => {
        return (
          matchesSearch(player, keyword) &&
          matchesType(player, typeFilter) &&
          matchesLeague(player, leagueFilter) &&
          matchesLevel(player, levelFilter) &&
          matchesStatus(player, statusFilter)
        );
      })
    );
  }, [players, searchText, typeFilter, leagueFilter, levelFilter, statusFilter]);

  function exportPlayersCsv() {
    const headers = [
      "球員",
      "守位",
      "分類",
      "球隊",
      "層級",
      "升降",
      "狀態異動",
      "上次先發",
      "預期先發",
    ];

    const rows = filteredPlayers.map((player) => [
      player.name,
      player.type,
      normalizeLeague(player.league),
      player.team,
      player.level,
      player.movement,
      player.note || player.status,
      player.lastStart,
      player.expectedStart,
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
    link.download = "TWDS_總表篩選結果.csv";
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
              可搜尋球員、球隊、層級、分類、守位
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
              onClick={exportPlayersCsv}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 transition"
            >
              匯出目前結果 CSV
            </button>
          </div>
        </div>

        <label className="block mb-4">
          <p className="text-slate-400 text-sm mb-2">搜尋</p>
          <input
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              updateFilter("q", event.target.value);
            }}
            placeholder="搜尋球員、球隊、層級、分類、守位..."
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white placeholder:text-slate-500"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <FilterSelect
            label="狀態"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(value) => {
              setStatusFilter(value);
              updateFilter("status", value);
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl shadow-black/30">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold">完整追蹤名單</h2>
          <p className="text-slate-400 text-sm mt-1">
            目前顯示：{filteredPlayers.length} / {players.length}
          </p>
        </div>

        <div className="max-h-[calc(100vh-260px)] overflow-auto overscroll-contain">
          <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-50 bg-slate-800 text-slate-300">
              <tr>
                <th className="sticky left-0 top-0 z-[70] bg-slate-800 p-3 text-left border-r border-slate-700">
                  球員
                </th>
                <th className="bg-slate-800 p-3 text-left">類型</th>
                <th className="bg-slate-800 p-3 text-left">聯盟</th>
                <th className="bg-slate-800 p-3 text-left">球隊</th>
                <th className="bg-slate-800 p-3 text-left">層級</th>
                <th className="bg-slate-800 p-3 text-left">升降</th>
                <th className="bg-slate-800 p-3 text-left">狀態異動</th>
                <th className="bg-slate-800 p-3 text-left">上次先發</th>
                <th className="bg-slate-800 p-3 text-left">預期先發</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-slate-400 border-t border-slate-800"
                  >
                    找不到符合條件的球員
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, index) => {
                  const name = normalizeText(player.name) || "-";
                  const movement = normalizeText(player.movement) || "-";
                  const statusText = normalizeText(player.note);
                  const hasStatusChange = statusText !== "" && statusText !== "-";

                  return (
                    <tr
                      key={`${name}-${index}`}
                      className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="sticky left-0 z-30 bg-slate-900 p-3 text-left font-medium border-r border-slate-800">
                        <Link
                          href={`/players/${encodeURIComponent(name)}`}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {name}
                        </Link>
                      </td>

                      <td className="p-3">
                        {normalizeText(player.type) || "-"}
                      </td>
                      <td className="p-3">{normalizeLeague(player.league)}</td>
                      <td className="p-3">
                        {normalizeText(player.team) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(player.level) || "-"}
                      </td>

                      <td className="p-3">
                        <span className={getMovementClass(movement)}>
                          {movement}
                        </span>
                      </td>

                      <td className="p-3">
                        {hasStatusChange ? (
                          <span className={getStatusClass(statusText)}>
                            {statusText}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="p-3">
                        {normalizeText(player.lastStart) || "-"}
                      </td>
                      <td className="p-3">
                        {normalizeText(player.expectedStart) || "-"}
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