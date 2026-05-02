"use client";

import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/src/lib/supabase";

type CsvRow = Record<string, string>;

export default function ImportCsvPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleFile(file: File) {
    setFileName(file.name);
    setMessage("");

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const cleanRows = result.data.map((row) => {
          const cleaned: CsvRow = {};

          Object.entries(row).forEach(([key, value]) => {
            const cleanKey = key.trim();
            cleaned[cleanKey] = String(value ?? "").trim();
          });

          return cleaned;
        });

        setRows(cleanRows);
      },
      error: (error) => {
        setMessage(`CSV 讀取失敗：${error.message}`);
      },
    });
  }

  async function uploadToSupabase() {
    if (rows.length === 0) {
      setMessage("請先選擇 CSV 檔案");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = rows.map((row) => ({
      report_date: row.report_date || row["日期"] || null,

      player_name:
        row.player_name ||
        row.name_zh ||
        row["球員"] ||
        row["姓名"] ||
        null,

      team:
        row.team ||
        row.team_name ||
        row["球隊"] ||
        null,

      league: row.league || row["聯盟"] || null,
      level: row.level || row["層級"] || null,
      position: row.position || row["守位"] || null,
      result: row.result || row["結果"] || null,

      ab: toNumber(row.ab || row["打數"]),
      r: toNumber(row.r || row["得分"]),
      h: toNumber(row.h || row["安打"]),
      rbi: toNumber(row.rbi || row["打點"]),
      bb: toNumber(row.bb || row["四壞"]),
      so: toNumber(row.so || row["三振"]),
      hr: toNumber(row.hr || row["全壘打"]),
      doubles: toNumber(row.doubles || row["二壘打"]),
      triples: toNumber(row.triples || row["三壘打"]),
      sb: toNumber(row.sb || row["盜壘"]),

      ip: row.ip || row["局數"] || null,
      er: toNumber(row.er || row["責失"]),
      bb_allowed: toNumber(row.bb_allowed || row["保送"]),
      k: toNumber(row.k || row["奪三振"]),
      pitch_count: toNumber(row.pitch_count || row["用球數"]),

      raw_data: row,
    }));

    const { error } = await supabase.from("daily_reports_import").insert(payload);

    if (error) {
      setMessage(`上傳失敗：${error.message}`);
    } else {
      setMessage(`成功上傳 ${payload.length} 筆資料`);
      setRows([]);
      setFileName("");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">CSV 上傳</h1>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">傳今日戰報 CSV</h2>

          <input
            className="mt-4 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <button
            onClick={uploadToSupabase}
            disabled={loading || rows.length === 0}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "上傳中..." : "寫入資料庫"}
          </button>

          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        </div>
      </section>
    </main>
  );
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  background: "#fff",
};

const button: React.CSSProperties = {
  display: "block",
  marginTop: 16,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #222",
  cursor: "pointer",
};

const table: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: 14,
};

const cell: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  whiteSpace: "nowrap",
};