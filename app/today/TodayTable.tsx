"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TodayReport } from "@/src/lib/excel";

type TodayTableProps = {
  todayPlayers: TodayReport[];
};

export default function TodayTable({ todayPlayers }: TodayTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchText, setSearchText] = useState(
    searchParams.get("q") || ""
  );

  const availableDates = Array.from(
    new Set(todayPlayers.map((report) => report.date).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || availableDates[0] || "全部"
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

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "全部" || value.trim() === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const queryString = params.toString();

    router.replace(queryString ? `/today?${queryString}` : "/today", {
      scroll: false,
    });
  }

  const filteredTodayPlayers = useMemo(() => {
    return todayPlayers.filter((report) => {
      const keyword = searchText.trim().toLowerCase();

      const matchSearch =
        keyword === "" ||
        String(report.name || "").toLowerCase().includes(keyword) ||
        String(report.team || "").toLowerCase().includes(keyword) ||
        String(report.level || "").toLowerCase().includes(keyword) ||
        String(report.league || "").toLowerCase().includes(keyword) ||
        String(report.type || "").toLowerCase().includes(keyword) ||
        String(report.opponent || "").toLowerCase().includes(keyword) ||
        String(report.stats || "").toLowerCase().includes(keyword);

      const typeText = String(report.type || "").trim();

      const matchDate =
        dateFilter === "全部" || report.date === dateFilter;

      const isPitcher =
        typeText.includes("投") ||
        typeText.toLowerCase().includes("pitcher") ||
        typeText.toLowerCase() === "p";

      const isHitter =
        typeText.includes("野") ||
        typeText.includes("外") ||
        typeText.includes("內") ||
        typeText.includes("捕") ||
        typeText.includes("打") ||
        typeText.toLowerCase().includes("hitter") ||
        typeText.toLowerCase().includes("batter") ||
        typeText.toLowerCase() === "h";

      const matchType =
        typeFilter === "全部" ||
        (typeFilter === "投手" && isPitcher) ||
        (typeFilter === "野手" && isHitter);

      const matchLeague =
        leagueFilter === "全部" || report.league === leagueFilter;

      const matchLevel =
        levelFilter === "全部" || report.level === levelFilter;

      return matchSearch && matchDate && matchType && matchLeague && matchLevel;
    });
  }, [todayPlayers, searchText, dateFilter, typeFilter, leagueFilter, levelFilter]);

  function exportTodayCsv() {
    const headers = [
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
      report.name || "",
      report.type || "",
      report.league || "",
      report.team || "",
      report.level || "",
      report.result || "",
      report.opponent || "",
      report.stats || "",
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
    link.download = "TWDS_今日戰報篩選結果.csv";
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
            onClick={exportTodayCsv}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 transition"
          >
            匯出目前結果 CSV
          </button>
        </div>
        <label className="block">
          <p className="text-slate-400 text-sm mb-2">日期</p>
          <select
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              updateFilter("date", event.target.value);
            }}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
          >
            <option>全部</option>
            {availableDates.map((date) => (
              <option key={date}>{date}</option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-4">
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
              <option>MLB</option>
              <option>MiLB</option>
              <option>NPB</option>
              <option>KBO</option>
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
        </div>
      </div>

      <div 
        style={{ marginTop: 40 }}
        className="bg-slate-900 rounded-2xl border border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold">今日戰報</h2>
          <p className="text-slate-400 text-sm mt-1">
            目前顯示：{filteredTodayPlayers.length} / {todayPlayers.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-separate border-spacing-0 text-sm whitespace-nowrap">
            <thead className="text-slate-300">
              <tr>
                <th className="sticky left-0 top-0 z-[70] bg-slate-800 text-left p-3 shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-700">
                  球員
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  類型
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  聯盟
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  球隊
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  層級
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  結果
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  對手
                </th>
                <th className="sticky top-0 z-[60] bg-slate-800 text-left p-3">
                  成績
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTodayPlayers.map((report, index) => (
                <tr
                  key={`${report.name}-${index}`}
                  className="border-t border-slate-800 hover:bg-slate-800/60"
                >
                  <td className="sticky left-0 z-10 bg-slate-900 p-3 font-medium shadow-[4px_0_8px_rgba(0,0,0,0.35)] border-r border-slate-800">
                    {report.name || "-"}
                  </td>
                  <td className="p-3">{report.type || "-"}</td>
                  <td className="p-3">{report.league || "-"}</td>
                  <td className="p-3">{report.team || "-"}</td>
                  <td className="p-3">{report.level || "-"}</td>
                  <td className="p-3">{report.result || "-"}</td>
                  <td className="p-3">{report.opponent || "-"}</td>
                  <td className="p-3">{report.stats || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}