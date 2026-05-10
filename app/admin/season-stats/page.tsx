"use client";

import { useState } from "react";

function parseTableText(text: string) {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].trim().split(/\s+/);
  const hasLgColumn = headers.includes("LG");

  return lines.slice(1).map((line) => {
    const values = line.trim().split(/\s+/);
    const row: Record<string, string> = {};

    let season = values[0];
    let team = values[1];
    let lg = "";
    let level = values[2];
    let statStartIndex = 3;

    if (hasLgColumn) {
      lg = values[2];
      level = values[3];
      statStartIndex = 4;

      if (/^\d{4}$/.test(values[0]) && values[2] === "teams") {
        team = `${values[1]} ${values[2]}`;
        lg = values[3];
        level = values[4];
        statStartIndex = 5;
      }

      if (values[1] === "Career") {
        season = `${values[0]} ${values[1]}`;
        team = values[2];
        lg = values[3];
        level = values[4];
        statStartIndex = 5;
      }
    } else {
      if (/^\d{4}$/.test(values[0]) && values[2] === "teams") {
        team = `${values[1]} ${values[2]}`;
        level = values[3];
        statStartIndex = 4;
      }

      if (values[1] === "Career") {
        season = `${values[0]} ${values[1]}`;
        team = values[2];
        level = values[3];
        statStartIndex = 4;
      }
    }

    row.Season = season;
    row.Team = team;
    row.LG = lg;
    row.Level = level;

    headers.slice(hasLgColumn ? 4 : 3).forEach((header, index) => {
      row[header] = values[statStartIndex + index] ?? "";
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
    level === "Minors"
  );
}

export default function AdminSeasonStatsPage() {
  const [apiKey, setApiKey] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [league, setLeague] = useState("MLB");
  const [statType, setStatType] = useState("batting");
  const [tableText, setTableText] = useState("");
  const [message, setMessage] = useState("");

  async function handleImport() {

    const parsedRows = parseTableText(tableText).map((row) => ({
      ...row,
      player_name: playerId,
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
      `匯入成功：正式 ${regularData.count ?? 0} 筆，合計 ${summaryData.count ?? 0} 筆`
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">匯入 Season Stats</h1>

        <div className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="TWDS_API_KEY"
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          />

          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="player_id"
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          />

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

          <textarea
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            placeholder="貼上官方表格，第一列要是欄位名稱"
            rows={14}
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 font-mono text-sm"
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