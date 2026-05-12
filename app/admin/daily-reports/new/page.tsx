"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type PlayerOption = {
  id: string;
  name_zh: string;
  name_en?: string | null;
};

const DAILY_HITTING_HEADERS = [
  "Date",
  "Team",
  "OPP",
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
  "SO",
  "SB",
  "CS",
  "AVG",
  "OBP",
  "SLG",
  "HBP",
  "SF",
];

const DAILY_PITCHING_HEADERS = [
  "Date",
  "Team",
  "OPP",
  "W",
  "L",
  "ERA",
  "G",
  "GS",
  "CG",
  "SHO",
  "SV",
  "SVO",
  "IP",
  "H",
  "R",
  "ER",
  "HR",
  "HB",
  "BB",
  "IBB",
  "SO",
  "NP-S",
  "AVG",
  "WHIP",
];

function text(value: unknown) {
  return String(value ?? "").trim();
}

function toNumberOrNull(value: unknown) {
  const valueText = text(value);
  if (!valueText) return null;
  const n = Number(valueText);
  return Number.isFinite(n) ? n : null;
}

function getCell(row: Record<string, string>, key: string) {
  return text(row[key]);
}

function parseTsv(input: string, expectedHeaders: string[]) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const firstColumns = lines[0].split("\t").map((v) => v.trim());
  const hasHeader =
    firstColumns.length >= 3 &&
    firstColumns[0].toLowerCase() === expectedHeaders[0].toLowerCase();

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, index) => {
    const values = line.split("\t");
    const row: Record<string, string> = {};

    expectedHeaders.forEach((header, headerIndex) => {
      row[header] = text(values[headerIndex]);
    });

    return {
      index,
      row,
      raw: line,
    };
  });
}

function buildHittingPayload(playerId: string, rows: ReturnType<typeof parseTsv>) {
  return rows.map(({ row }) => ({
    player_id: playerId,
    stat_type: "batting",
    report_date: getCell(row, "Date"),
    team_name: getCell(row, "Team") || null,
    opponent: getCell(row, "OPP") || null,
    position: "野手",
    result: "出賽",

    ab: toNumberOrNull(row.AB),
    r: toNumberOrNull(row.R),
    h: toNumberOrNull(row.H),
    tb: toNumberOrNull(row.TB),
    doubles: toNumberOrNull(row["2B"]),
    triples: toNumberOrNull(row["3B"]),
    hr: toNumberOrNull(row.HR),
    rbi: toNumberOrNull(row.RBI),
    bb: toNumberOrNull(row.BB),
    ibb: toNumberOrNull(row.IBB),
    k: toNumberOrNull(row.SO),
    sb: toNumberOrNull(row.SB),
    cs: toNumberOrNull(row.CS),
    hbp: toNumberOrNull(row.HBP),
    sf: toNumberOrNull(row.SF),

    avg: getCell(row, "AVG") || null,
    obp: getCell(row, "OBP") || null,
    slg: getCell(row, "SLG") || null,
  }));
}

function buildPitchingPayload(playerId: string, rows: ReturnType<typeof parseTsv>) {
  return rows.map(({ row }) => {

    return {
      player_id: playerId,
      stat_type: "pitching",
      report_date: getCell(row, "Date"),
      team_name: getCell(row, "Team") || null,
      opponent: getCell(row, "OPP") || null,
      position: "投手",
      result: "出賽",

      w: toNumberOrNull(row.W),
      l: toNumberOrNull(row.L),
      era: getCell(row, "ERA") || null,
      g: toNumberOrNull(row.G),
      gs: toNumberOrNull(row.GS),
      cg: toNumberOrNull(row.CG),
      sho: toNumberOrNull(row.SHO),
      sv: toNumberOrNull(row.SV),
      svo: toNumberOrNull(row.SVO),

      ip: getCell(row, "IP") || null,
      h: toNumberOrNull(row.H),
      r: toNumberOrNull(row.R),
      er: toNumberOrNull(row.ER),
      hr: toNumberOrNull(row.HR),
      hbp: toNumberOrNull(row.HB),
      bb: toNumberOrNull(row.BB),
      ibb: toNumberOrNull(row.IBB),
      k: toNumberOrNull(row.SO),
      np_s: getCell(row, "NP-S") || null,

      avg: getCell(row, "AVG") || null,
      whip: getCell(row, "WHIP") || null,
    };
  });
}

export default function NewDailyReportsPage() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [statType, setStatType] = useState<"hitting" | "pitching">("hitting");
  const [rawInput, setRawInput] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headers = statType === "hitting" ? DAILY_HITTING_HEADERS : DAILY_PITCHING_HEADERS;

  const parsedRows = useMemo(() => parseTsv(rawInput, headers), [rawInput, headers]);

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

      const list = (data ?? []) as PlayerOption[];
      setPlayers(list);

      if (!playerId && list[0]?.id) {
        setPlayerId(list[0].id);
      }
    }

    loadPlayers();
  }, [playerId]);

  async function handleSubmit() {
    setMessage("");

    if (!playerId) {
      setMessage("請先選擇球員");
      return;
    }

    if (!parsedRows.length) {
      setMessage("請貼上至少一列資料");
      return;
    }

    const payload =
      statType === "hitting"
        ? buildHittingPayload(playerId, parsedRows)
        : buildPitchingPayload(playerId, parsedRows);

    const invalid = payload.find((row) => !row.report_date);
    if (invalid) {
      setMessage("Date 不可空白");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/daily-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": password,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error || result?.message || "匯入失敗");
      }

      setMessage(`匯入成功：${payload.length} 筆`);
      setRawInput("");
    } catch (error: any) {
      setMessage(`匯入失敗：${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">新增球員出賽紀錄</h1>
          <p className="mt-2 text-sm text-slate-400">
            改成 season_stats 風格：選球員、選類型，貼上 TSV 多列資料後批次匯入 daily_reports。
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <p className="mb-2 text-sm text-slate-400">球員</p>
              <select
                value={playerId}
                onChange={(event) => setPlayerId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name_zh}
                    {player.name_en ? `｜${player.name_en}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <p className="mb-2 text-sm text-slate-400">成績類型</p>
              <select
                value={statType}
                onChange={(event) => {
                  setStatType(event.target.value as "hitting" | "pitching");
                  setRawInput("");
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
              >
                <option value="hitting">hitting 打者</option>
                <option value="pitching">pitching 投手</option>
              </select>
            </label>

            <label className="block">
              <p className="mb-2 text-sm text-slate-400">Admin 密碼 / API Key</p>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-400">欄位格式</p>
            <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300">
              {headers.join("\t")}
            </pre>
          </div>

          <label className="block">
            <p className="mb-2 text-sm text-slate-400">貼上資料</p>
            <textarea
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              rows={12}
              placeholder={headers.join("\t")}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 font-mono text-sm text-white placeholder:text-slate-500"
            />
          </label>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
            預覽筆數：{parsedRows.length}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-sky-600 px-4 py-3 font-bold text-white transition hover:bg-sky-500 disabled:opacity-60"
          >
            {isSubmitting ? "匯入中..." : "匯入 daily_reports"}
          </button>

          {message ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
              {message}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
