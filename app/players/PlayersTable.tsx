"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sortPlayersForTable } from "@/src/utils/sortPlayers";
import { getMovementClass, getStatusClass } from "@/src/utils/playerStyles";
import type { Player } from "@/src/lib/excel";

type PlayersTableProps = {
  players: Player[];
};

export default function PlayersTable({ players }: PlayersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(
    searchParams.get("q") || ""
  );

  const [typeFilter, setTypeFilter] = useState(
    searchParams.get("type") || "全部"
  );
  const [leagueFilter, setLeagueFilter] = useState(
    searchParams.get("league") || "全部"
  );
  const [levelFilter, setLevelFilter] = useState(
    searchParams.get("level") || "全部"
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "全部"
  );

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

  if (value === "全部" || value.trim() === "") {
    params.delete(key);
  } else {
    params.set(key, value);
  }

    const queryString = params.toString();
    router.replace(queryString ? `/players?${queryString}` : "/players", {
      scroll: false,
    });
  }

  const filteredPlayers = useMemo(() => {
    return sortPlayersForTable(
      players.filter((player) => {
        const keyword = searchText.trim().toLowerCase();

        const matchSearch =
          keyword === "" ||
          String(player.name || "").toLowerCase().includes(keyword) ||
          String(player.team || "").toLowerCase().includes(keyword) ||
          String(player.level || "").toLowerCase().includes(keyword) ||
          String(player.league || "").toLowerCase().includes(keyword) ||
          String(player.type || "").toLowerCase().includes(keyword);
          
        const playerType = String(player.type || "")
          .replace(/\s/g, "")
          .replace(/　/g, "")
          .trim();

        const isPitcher =
          playerType.includes("投手") ||
          playerType.toLowerCase().includes("pitcher") ||
          playerType.toLowerCase() === "p";

        const isHitter =
          playerType.includes("外野手") ||
          playerType.includes("內野手") ||
          playerType.includes("野手") ||
          playerType.includes("捕手") ||
          playerType.includes("打者") ||
          playerType.toLowerCase().includes("hitter") ||
          playerType.toLowerCase().includes("batter") ||
          playerType.toLowerCase() === "h";

        const matchType =
          typeFilter === "全部" ||
          (typeFilter === "投手" && isPitcher) ||
          (typeFilter === "野手" && isHitter);

        const playerLeague = String(player.league || "").trim();

        const normalizedLeague =
          playerLeague === "旅美" || playerLeague === "MLB" || playerLeague === "MiLB"
            ? "美職"
            : playerLeague === "旅日" || playerLeague === "NPB"
            ? "日職"
            : playerLeague === "旅韓" || playerLeague === "KBO"
            ? "韓職"
            : playerLeague;

        const matchLeague =
          leagueFilter === "全部" || normalizedLeague === leagueFilter;
        const matchLevel =
          levelFilter === "全部" || player.level === levelFilter;

        const playerStatusText = `${player.status || ""} ${player.note || ""}`;

        const matchStatus =
          statusFilter === "全部" ||
          (statusFilter === "現役" && player.status === "現役") ||
          (statusFilter === "傷兵" && playerStatusText.includes("傷")) ||
          (statusFilter === "異動" &&
            ((player.movement && player.movement !== "-") ||
              (player.note && player.note !== "-")));

        return matchSearch && matchType && matchLeague && matchLevel && matchStatus;
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
      player.name || "",
      player.type || "",
      player.league || "",
      player.team || "",
      player.level || "",
      player.movement || "",
      player.note || player.status || "",
      player.lastStart || "",
      player.expectedStart || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
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
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">篩選條件</h2>

          <button
            type="button"
            onClick={exportPlayersCsv}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 transition"
          >
            匯出目前結果 CSV
          </button>
        </div>

        <label className="block md:col-span-4">
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
          <label className="block">
            <p className="text-slate-400 text-sm mb-2">類型</p>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                updateFilter("type", event.target.value);
              }}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            >
              <option>全部</option>
              <option>投手</option>
              <option>野手</option>
            </select>
          </label>

          <label className="block">
            <p className="text-slate-400 text-sm mb-2">聯盟</p>
            <select
              value={leagueFilter}
              onChange={(event) => {
                setLeagueFilter(event.target.value);
                updateFilter("league", event.target.value);
              }}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            >
              <option>全部</option>
              <option>美職</option>
              <option>日職</option>
              <option>韓職</option>
              <option>台裔</option>
              <option>其他</option>
            </select>
          </label>

          <label className="block">
            <p className="text-slate-400 text-sm mb-2">層級</p>
            <select
              value={levelFilter}
              onChange={(event) => {
                setLevelFilter(event.target.value);
                updateFilter("level", event.target.value);
              }}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            >
              <option>全部</option>
              <option>MLB</option>
              <option>3A</option>
              <option>2A</option>
              <option>A+</option>
              <option>1A</option>
              <option>RK</option>
              <option>日職一軍</option>
              <option>日職二軍</option>
              <option>韓職一軍</option>
            </select>
          </label>

          <label className="block">
            <p className="text-slate-400 text-sm mb-2">狀態</p>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                updateFilter("status", event.target.value);
              }}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            >
              <option>全部</option>
              <option>現役</option>
              <option>傷兵</option>
              <option>異動</option>
            </select>
          </label>
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
              {filteredPlayers.map((player, index) => {
                const name = String(player.name ?? "-");
                const movement = String(player.movement ?? "-");
                const statusText = String(player.note ?? player.status ?? "-");

                return (
                  <tr
                    key={`${name}-${index}`}
                    className="border-t border-slate-800 hover:bg-slate-800/60"
                  >
                    <td className="sticky left-0 z-30 bg-slate-900 p-3 text-left font-medium border-r border-slate-800">
                      <Link
                        href={`/players/${encodeURIComponent(String(player.name ?? ""))}`}
                        className="text-sky-300 hover:text-sky-200 hover:underline"
                      >
                        {String(player.name ?? "-")}
                      </Link>
                    </td>
                    
                    <td className="p-3">{String(player.type ?? "-")}</td>
                    <td className="p-3">
                      {String(player.league ?? "-")
                        .replace("旅美", "美職")
                        .replace("旅日", "日職")
                        .replace("旅韓", "韓職")}
                    </td>
                    <td className="p-3">{String(player.team ?? "-")}</td>
                    <td className="p-3">{String(player.level ?? "-")}</td>

                    <td className="p-3">
                      <span className={getMovementClass(String(movement ?? ""))}>
                        {String(movement ?? "-")}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={getStatusClass(String(statusText ?? ""))}>
                        {String(statusText ?? "-")}
                      </span>
                    </td>

                    <td className="p-3">{String(player.lastStart ?? "-")}</td>
                    <td className="p-3">{String(player.expectedStart ?? "-")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}