"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/src/lib/supabase";

type CsvRow = Record<string, string>;

type PlayerOption = {
  id: string;
  name_zh: string;
  name_en?: string | null;
};

export default function ImportCsvPage() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const filteredPlayers = useMemo(() => {
    const keyword = playerSearch.trim().toLowerCase();
    if (!keyword || selectedPlayer) return [];

    return players
      .filter((player) => {
        return `${player.name_zh ?? ""}${player.name_en ?? ""}`
          .toLowerCase()
          .includes(keyword);
      })
      .slice(0, 20);
  }, [players, playerSearch, selectedPlayer]);

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
    if (!selectedPlayer?.id) {
      setMessage("請先搜尋並選擇球員");
      return;
    }

    if (rows.length === 0) {
      setMessage("請先選擇 CSV 檔案");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = rows.map((row) => ({
      player_id: selectedPlayer.id,

      report_date:
        row.report_date ||
        row.date ||
        row.Date ||
        row["日期"] ||
        null,

      team:
        row.team ||
        row.team_name ||
        row.Team ||
        row["球隊"] ||
        null,

      opponent:
        row.opponent ||
        row.opp ||
        row.OPP ||
        row["對手"] ||
        null,

      league: row.league || row["聯盟"] || null,
      level: row.level || row.Level || row["層級"] || null,
      position: row.position || row["守位"] || null,
      result: row.result || row["結果"] || "出賽",

      ab: toNumber(row.ab || row.AB || row["打數"]),
      pa: toNumber(row.pa || row.PA || row["打席"]),
      r: toNumber(row.r || row.R || row["得分"]),
      h: toNumber(row.h || row.H || row["安打"]),
      tb: toNumber(row.tb || row.TB || row["壘打數"]),
      rbi: toNumber(row.rbi || row.RBI || row["打點"]),
      bb: toNumber(row.bb || row.BB || row["四壞"] || row["保送"]),
      ibb: toNumber(row.ibb || row.IBB || row["故意四壞"]),
      k: toNumber(row.k || row.K || row.so || row.SO || row["三振"] || row["奪三振"]),
      hr: toNumber(row.hr || row.HR || row["全壘打"]),
      doubles: toNumber(row.doubles || row["2B"] || row["二壘打"]),
      triples: toNumber(row.triples || row["3B"] || row["三壘打"]),
      sb: toNumber(row.sb || row.SB || row["盜壘"]),
      cs: toNumber(row.cs || row.CS || row["盜壘失敗"]),
      hbp: toNumber(row.hbp || row.HBP || row.hb || row.HB || row["觸身球"]),
      sf: toNumber(row.sf || row.SF || row["高飛犧牲打"]),

      ip: row.ip || row.IP || row["局數"] || null,
      er: toNumber(row.er || row.ER || row["責失"]),
      bf: toNumber(row.bf || row.BF || row["面對打席"]),
      pitch_count: toNumber(row.pitch_count || row.NP || row["用球數"]),

      avg: row.avg || row.AVG || null,
      obp: row.obp || row.OBP || null,
      slg: row.slg || row.SLG || null,
      era: row.era || row.ERA || null,
      whip: row.whip || row.WHIP || null,

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
          <h2 className="text-xl font-bold">傳球員出賽紀錄 CSV</h2>

          <div className="mt-4 relative">
            <p className="mb-2 text-sm text-slate-400">球員</p>

            <input
              value={playerSearch}
              onChange={(event) => {
                setPlayerSearch(event.target.value);
                setSelectedPlayer(null);
              }}
              placeholder="搜尋球員中文或英文名..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white placeholder:text-slate-500"
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
                        `${player.name_zh}${player.name_en ? `｜${player.name_en}` : ""}`
                      );
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-white hover:bg-slate-800"
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