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

      team: row.team || row.team_name || row["球隊"] || null,

      league: row.league || row["聯盟"] || null,
      level: row.level || row["層級"] || null,
      position: row.position || row["守位"] || null,
      result: row.result || row["結果"] || null,

      ab: toNumber(row.ab || row["打數"]),
      pa: toNumber(row.pa || row["PA"] || row["打席"]),
      r: toNumber(row.r || row["得分"]),
      h: toNumber(row.h || row["安打"]),
      rbi: toNumber(row.rbi || row["打點"]),
      bb: toNumber(row.bb || row["四壞"] || row["保送"]),
      k: toNumber(row.k || row["K"] || row["三振"] || row["奪三振"]),
      hr: toNumber(row.hr || row["全壘打"]),
      doubles: toNumber(row.doubles || row["二壘打"]),
      triples: toNumber(row.triples || row["三壘打"]),
      sb: toNumber(row.sb || row["盜壘"]),
      hbp: toNumber(row.hbp || row["HBP"] || row["觸身球"]),
      sf: toNumber(row.sf || row["SF"] || row["高飛犧牲打"]),

      ip: row.ip || row["局數"] || null,
      er: toNumber(row.er || row["責失"]),
      bf: toNumber(row.bf || row["BF"] || row["面對打席"]),
      pitch_count: toNumber(row.pitch_count || row["用球數"]),

      raw_data: row,
    }));

    const { error } = await supabase
      .from("daily_reports_import")
      .insert(payload);

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

          {fileName ? (
            <p className="mt-3 text-sm text-slate-400">
              已選擇：{fileName}｜共 {rows.length} 筆
            </p>
          ) : null}

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