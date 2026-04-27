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

const TYPE_OPTIONS = ["投手", "野手"];
const LEAGUE_OPTIONS = ["美職", "日職", "韓職", "台裔", "其他"];
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
const STATUS_OPTIONS = ["現役", "傷兵", "異動"];

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

function matchesType(player: Player, selectedTypes: string[]): boolean {
  if (selectedTypes.length === 0) return true;

  return (
    (selectedTypes.includes("投手") && isPitcher(player)) ||
    (selectedTypes.includes("野手") && isHitter(player))
  );
}

function matchesLeague(player: Player, selectedLeagues: string[]): boolean {
  if (selectedLeagues.length === 0) return true;

  return selectedLeagues.includes(normalizeLeague(player.league));
}

function matchesLevel(player: Player, selectedLevels: string[]): boolean {
  if (selectedLevels.length === 0) return true;

  return selectedLevels.includes(normalizeText(player.level));
}

function matchesStatus(player: Player, selectedStatuses: string[]): boolean {
  if (selectedStatuses.length === 0) return true;

  const status = normalizeText(player.status);
  const statusText = `${normalizeText(player.status)} ${normalizeText(
    player.note
  )}`;

  return selectedStatuses.some((selectedStatus) => {
    if (selectedStatus === "現役") return status === "現役";
    if (selectedStatus === "傷兵") return statusText.includes("傷");
    if (selectedStatus === "異動") {
      return hasValue(player.movement) || hasValue(player.note);
    }

    return false;
  });
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

export default function PlayersTable({ players }: PlayersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    parseMultiParam(searchParams.get("type"))
  );
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(
    parseMultiParam(searchParams.get("league"))
  );
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    parseMultiParam(searchParams.get("level"))
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    parseMultiParam(searchParams.get("status"))
  );

  function applyFilters() {
    const params = new URLSearchParams();

    if (searchText.trim()) {
      params.set("q", searchText.trim());
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

    if (selectedStatuses.length > 0) {
      params.set("status", selectedStatuses.join(","));
    }

    const queryString = params.toString();

    router.replace(queryString ? `/players?${queryString}` : "/players", {
      scroll: false,
    });
  }

  function clearFilters() {
    setSearchText("");
    setSelectedTypes([]);
    setSelectedLeagues([]);
    setSelectedLevels([]);
    setSelectedStatuses([]);

    router.replace("/players", { scroll: false });
  }

  const filteredPlayers = useMemo(() => {
    const keyword = normalizeSearchText(searchText);

    return sortPlayersForTable(
      players.filter((player) => {
        return (
          matchesSearch(player, keyword) &&
          matchesType(player, selectedTypes) &&
          matchesLeague(player, selectedLeagues) &&
          matchesLevel(player, selectedLevels) &&
          matchesStatus(player, selectedStatuses)
        );
      })
    );
  }, [
    players,
    searchText,
    selectedTypes,
    selectedLeagues,
    selectedLevels,
    selectedStatuses,
  ]);

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
      <details className="bg-slate-900 rounded-2xl border border-slate-800 mb-6 p-5">
        <summary className="list-none cursor-pointer inline-flex w-fit items-center rounded border border-slate-700 px-1.5 py-0 text-xs leading-5 text-slate-300 hover:bg-slate-800">
          篩選條件
        </summary>

        <div className="mt-5 space-y-5">
          <label className="block">
            <p className="text-slate-400 text-sm mb-2">搜尋</p>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜尋球員、球隊、層級、分類、守位..."
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

          <CheckboxGroup
            title="狀態"
            options={STATUS_OPTIONS}
            values={selectedStatuses}
            onChange={setSelectedStatuses}
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
              onClick={exportPlayersCsv}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition"
            >
              匯出目前結果 CSV
            </button>
          </div>
        </div>
      </details>

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
                  const hasStatusChange =
                    statusText !== "" && statusText !== "-";

                  return (
                    <tr
                      key={`${name}-${index}`}
                      className="border-t border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="sticky left-0 z-30 bg-slate-900 p-3 text-left font-bold border-r border-slate-800">
                        <Link
                          href={`/players/${encodeURIComponent(
                            player.id || name
                          )}`}
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