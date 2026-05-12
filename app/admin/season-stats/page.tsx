"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import SiteHeader from "@/src/components/SiteHeader";
import AdminImportButtons from "../AdminImportButtons";

type PlayerOption = {
  id: string;
  name_zh: string;
  name_en?: string | null;
};

function parseTableText(text: string, headers: string[]) {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 1) return [];

  return lines.map((line) => {
    const values = line.trim().split(/\s+/);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function isSummaryRow(row: Record<string, string>) {
  const season = String(row.Season ?? "").trim();
  const team = String(row.Team ?? "").trim();
  const level = String(row.Level ?? "").trim();

  return (
    season.includes("Career") ||
    team.includes("teams") ||
    team === "-" ||
    level === "Minors" ||
    level === "合計"
  );
}

export default function AdminSeasonStatsPage() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [league, setLeague] = useState("MLB");
  const [statType, setStatType] = useState("batting");
  const [tableText, setTableText] = useState("");
  const [message, setMessage] = useState("");

  const filteredPlayers = useMemo(() => {
    const keyword = playerSearch.trim().toLowerCase();
    if (!keyword || selectedPlayer) return [];

    return players
      .filter((player) =>
        `${player.name_zh ?? ""}${player.name_en ?? ""}`
          .toLowerCase()
          .includes(keyword)
      )
      .slice(0, 20);
  }, [players, playerSearch, selectedPlayer]);

    const headers =
      statType === "batting"
        ? [
            "Season",
            "Team",
            "Level",
            "G",
            "PA",
            "AB",
            "R",
            "H",
            "TB",
            "2B",
            "3B",
            "HR",
            "RBI",
            "BB",
            "IBB",
            "HBP",
            "SO",
            "SB",
            "CS",
            "SF",
            "AVG",
            "OBP",
            "SLG",
            "OPS",
            "GO/AO",
            "K%",
            "BB%",
            "BABIP",
          ]
        : [
            "Season",
            "Team",
            "Level",
            "W",
            "L",
            "ERA",
            "G",
            "GS",
            "CG",
            "SHO",
            "HLD",
            "SV",
            "SVO",
            "IP",
            "H",
            "R",
            "ER",
            "HR",
            "NP",
            "HBP",
            "BB",
            "IBB",
            "SO",
            "AVG",
            "WHIP",
            "GO/AO",
            "K/9",
            "BB/9",
            "HR/9",
            "H/9",
            "K/BB",
          ];

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("id, name_zh, name_en")
        .order("name_zh", { ascending: true });

      if (error) {
        setMessage(`讀取球員失敗：${error.message}`);
        return;
      }

      setPlayers((data ?? []) as PlayerOption[]);
    }

    loadPlayers();
  }, []);

  async function handleImport() {
    if (!selectedPlayer?.id) {
      setMessage("請先搜尋並選擇球員");
      return;
    }

    const parsedRows = parseTableText(tableText, headers).map((row) => ({
      ...row,
      player_id: selectedPlayer.id,
      player_name: selectedPlayer.name_zh,
      league,
      stat_type: statType,
      team_name: row.Team,
      level: row.Level,
    }));

    const regularRows = parsedRows.filter((row) => !isSummaryRow(row));
    const summaryRows = parsedRows.filter((row) => isSummaryRow(row));

    const regularRes =
      regularRows.length > 0
        ? await fetch("/api/import-season-stats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify(regularRows),
          })
        : null;

    const summaryRes =
      summaryRows.length > 0
        ? await fetch("/api/import-season-stats-summary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify(summaryRows),
          })
        : null;

    const regularData = regularRes ? await regularRes.json() : { count: 0 };
    const summaryData = summaryRes ? await summaryRes.json() : { count: 0 };

    if (regularRes && !regularRes.ok) {
      setMessage(`正式列匯入失敗：${regularData.error || "unknown error"}`);
      return;
    }

    if (summaryRes && !summaryRes.ok) {
      setMessage(`合計列匯入失敗：${summaryData.error || "unknown error"}`);
      return;
    }

    setMessage(
      `匯入成功：正式 ${regularData.count ?? 0} 筆，合計 ${
        summaryData.count ?? 0
      } 筆`
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <SiteHeader subtitle="TWDS Admin" />

        <AdminImportButtons />

          <Link
            href="/admin"
            className="inline-flex w-fit rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            ← 回 TWDS Admin
          </Link>

        <h1 className="text-3xl font-bold">匯入 Season Stats</h1>

        <div className="grid gap-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="TWDS_API_KEY"
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          />

          <div className="relative">
            <input
              value={playerSearch}
              onChange={(e) => {
                setPlayerSearch(e.target.value);
                setSelectedPlayer(null);
              }}
              placeholder="搜尋球員中文或英文名"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
            />

            {filteredPlayers.length > 0 ? (
              <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlayer(player);
                      setPlayerSearch(
                        `${player.name_zh}${
                          player.name_en ? `｜${player.name_en}` : ""
                        }`
                      );
                    }}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-800"
                  >
                    <div className="font-bold">{player.name_zh}</div>
                    {player.name_en ? (
                      <div className="text-xs text-slate-400">{player.name_en}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
            >
              <option value="MLB">MLB</option>
              <option value="MiLB">MiLB</option>
              <option value="NPB">NPB</option>
              <option value="KBO">KBO</option>
            </select>

            <select
              value={statType}
              onChange={(e) => setStatType(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
            >
              <option value="batting">batting</option>
              <option value="pitching">pitching</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-400">
              欄位格式（直接貼資料，不用貼欄位名）
            </p>

            <div className="max-w-full overflow-x-auto rounded-xl border border-slate-700 bg-slate-950">
              <pre className="min-w-max whitespace-nowrap p-4 font-mono text-xs text-slate-300">
                {headers.join("\t")}
              </pre>
            </div>
          </div>

            <textarea
              value={tableText}
              onChange={(e) => setTableText(e.target.value)}
              placeholder="直接貼資料列"
              rows={14}
              wrap="off"
              className="block w-full max-w-full overflow-x-scroll whitespace-pre rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm"
            />

          <button
            type="button"
            onClick={handleImport}
            className="rounded-xl bg-sky-600 px-5 py-3 font-bold hover:bg-sky-500"
          >
            匯入 season_stats
          </button>

          {message ? <p className="text-slate-300">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}