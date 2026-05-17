"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type PlayerOption = {
  id: string;
  name_zh: string;
  name_en?: string | null;
  name_ja?: string | null;
  name_ko?: string | null;
};

type SourceType =
  | "game_logs"
  | "season_stats"
  | "latest_transactions"
  | "mlb_pipeline"
  | "fangraphs_scouting";

type LeagueType = "MLB_MILB" | "NPB" | "KBO";

const LEAGUE_OPTIONS: { value: LeagueType; label: string }[] = [
  { value: "MLB_MILB", label: "MLB / MiLB" },
  { value: "NPB", label: "日職 NPB" },
  { value: "KBO", label: "韓職 KBO" },
];

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "season_stats", label: "Season Stats｜年度成績" },
  { value: "game_logs", label: "Game Logs｜逐場紀錄" },
  { value: "latest_transactions", label: "Latest Transactions｜最新異動" },
  { value: "mlb_pipeline", label: "MLB Pipeline｜球探報告" },
  { value: "fangraphs_scouting", label: "FanGraphs｜球探報告" },
];

export default function AdminSourcesPage() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("season_stats");
  const [sourceInput, setSourceInput] = useState("");
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const [seasonStatsPreview, setSeasonStatsPreview] = useState<any[]>([]);
  const [transactionsPreview, setTransactionsPreview] = useState<any[]>([]);
  const [teamName, setTeamName] = useState("");
  const [level, setLevel] = useState("AAA");
  const [seasonYear, setSeasonYear] = useState(String(new Date().getFullYear()));
  const [gameLogsPreview, setGameLogsPreview] = useState<any[]>([]);
  const [statType, setStatType] = useState("batting");
  const [playerKeyword, setPlayerKeyword] = useState("");
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [leagueType, setLeagueType] = useState<LeagueType>("MLB_MILB");
  const [selectedPlayerNameJa, setSelectedPlayerNameJa] = useState("");

  function resetPreview() {
    setPreview([]);
    setSeasonStatsPreview([]);
    setTransactionsPreview([]);
    setGameLogsPreview([]);
  }

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("id, name_zh, name_en, name_ja, name_ko")
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

  const filteredPlayers = players.filter((player) => {
    const keyword = playerKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return `${player.name_zh}${player.name_en ?? ""}`
      .toLowerCase()
      .includes(keyword);
  });

  async function handleFetchPreview() {
    setMessage("");
    resetPreview();

    if (!playerId) {
      setMessage("請先選擇球員");
      return;
    }

    if (!sourceInput.trim()) {
      setMessage("請輸入來源網址、球員 ID 或原始資料");
      return;
    }

    setIsFetching(true);

    try {
      const res = await fetch("/api/admin/sources/fetch-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: sourceInput,
          playerId,
          players,
          playerName:
            players.find((player) => player.id === playerId)?.name_zh ?? "",
          selectedPlayerNameJa:
            selectedPlayerNameJa ||
            players.find((player) => player.id === playerId)?.name_ja ||
            "",
          selectedPlayerNameKo:
            players.find((player) => player.id === playerId)?.name_ko || "",
          teamName,
          leagueType,
          level,
          seasonYear,
          sourceType,
          statType,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "抓取失敗");
      }

      setPreview([result]);
      setSeasonStatsPreview(result.seasonStatsPreview ?? []);
      setTransactionsPreview(result.transactionsPreview ?? []);
      setGameLogsPreview(result.gameLogsPreview ?? []);
      setMessage(
        `抓取完成：season_stats ${result.seasonStatsPreview?.length ?? 0} 筆，transactions ${result.transactionsPreview?.length ?? 0} 筆，game_logs ${result.gameLogsPreview?.length ?? 0} 筆`
      );
    } catch (error: any) {
      setMessage(`抓取失敗：${error.message}`);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleImportSeasonStats() {
    setMessage("");

    if (!seasonStatsPreview.length) {
      setMessage("沒有可匯入的 season_stats");
      return;
    }

    try {
      const res = await fetch("/api/admin/sources/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": password,
        },
        body: JSON.stringify({
          seasonStats: seasonStatsPreview.map(({ target_table, ...row }) => row),
          transactions: [],
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "匯入失敗");
      }

      setMessage(
        `season_stats 匯入成功：${result.results?.seasonStats?.length ?? 0} 筆`
      );
    } catch (error: any) {
      setMessage(`匯入失敗：${error.message}`);
    }
  }

  async function handleImportTransactions() {
    setMessage("");

    if (!transactionsPreview.length) {
      setMessage("沒有可匯入的 player_events");
      return;
    }

    try {
      const cleanedTransactions = Array.from(
        new Map(
          transactionsPreview
            .filter((row) => row.event_type !== "transaction")
            .map((row) => {
              const cleaned = {
                player_id: playerId,
                event_type: row.event_type,
                event_date_text: row.event_date_text,
                note: row.note || row.raw_transaction,
              };

              const key = [
                cleaned.player_id,
                cleaned.event_date_text,
                cleaned.event_type,
                cleaned.note,
              ].join("|");

              return [key, cleaned];
            })
        ).values()
      );

      const res = await fetch("/api/admin/sources/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": password,
        },
        body: JSON.stringify({
          seasonStats: [],
          transactions: cleanedTransactions,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "匯入失敗");
      }

      setMessage(
        `player_events 匯入成功：${result.results?.transactions?.length ?? 0} 筆`
      );
    } catch (error: any) {
      setMessage(`匯入失敗：${error.message}`);
    }
  }

  async function handleImportDailyReports() {
    setMessage("");

    if (!gameLogsPreview.length) {
      setMessage("沒有可匯入的 daily_reports");
      return;
    }

    try {
      const res = await fetch("/api/admin/sources/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": password,
        },
        body: JSON.stringify({
          seasonStats: [],
          transactions: [],
          dailyReports: gameLogsPreview,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "匯入失敗");
      }

      setMessage(
        `daily_reports 匯入成功：${result.results?.dailyReports?.length ?? 0} 筆`
      );
    } catch (error: any) {
      setMessage(`匯入失敗：${error.message}`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">資料來源中心</h1>
          <p className="mt-2 text-sm text-slate-400">
            半自動抓取 Game Logs、Season Stats、Latest Transactions、MLB Pipeline、FanGraphs。
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <p className="mb-2 text-sm text-slate-400">球員</p>

              <input
                value={playerKeyword}
                onChange={(event) => {
                  setPlayerKeyword(event.target.value);
                  setShowPlayerList(true);
                }}
                onFocus={() => setShowPlayerList(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowPlayerList(false);
                  }, 150);
                }}
                placeholder="搜尋中文名 / 英文名"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              />

              {showPlayerList ? (
                <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                  {filteredPlayers.length ? (
                    filteredPlayers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          setPlayerId(player.id);
                          setSelectedPlayerNameJa(player.name_ja ?? "");
                          setPlayerKeyword(
                            `${player.name_zh}${player.name_en ? `｜${player.name_en}` : ""}`
                          );
                          setShowPlayerList(false);
                          resetPreview();
                        }}
                        className="block w-full px-4 py-3 text-left hover:bg-slate-800"
                      >
                        <div className="font-bold">{player.name_zh}</div>
                        {player.name_en ? (
                          <div className="text-xs text-slate-400">{player.name_en}</div>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400">沒有找到球員</div>
                  )}
                </div>
              ) : null}
            </div>

            <label>
              <p className="mb-2 text-sm text-slate-400">來源類型</p>
              <select
                value={sourceType}
                onChange={(event) => {
                  setSourceType(event.target.value as SourceType);
                  resetPreview();
                  setMessage("");
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <p className="mb-2 text-sm text-slate-400">聯盟來源</p>
              <select
                value={leagueType}
                onChange={(event) => {
                  setLeagueType(event.target.value as LeagueType);
                  resetPreview();
                  setMessage("");
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              >
                {LEAGUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <p className="mb-2 text-sm text-slate-400">Admin 密碼 / API Key</p>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label>
              <p className="mb-2 text-sm text-slate-400">球隊</p>
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="例如：守護者"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              />
            </label>

            <label>
              <p className="mb-2 text-sm text-slate-400">成績類型</p>
              <select
                value={statType}
                onChange={(event) => setStatType(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              >
                <option value="batting">打者</option>
                <option value="pitching">投手</option>
              </select>
            </label>

            <label>
              <p className="mb-2 text-sm text-slate-400">層級</p>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              >
                <option value="MLB">MLB</option>
                <option value="AAA">AAA</option>
                <option value="AA">AA</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="ROK">ROK</option>
                <option value="Minors">Minors</option>
                <option value="日職一軍">日職一軍</option>
                <option value="日職二軍">日職二軍</option>
                <option value="日職三軍">日職三軍</option>
                <option value="韓職一軍">韓職一軍</option>
                <option value="韓職二軍">韓職二軍</option>
              </select>
            </label>

            <label>
              <p className="mb-2 text-sm text-slate-400">年份</p>
              <input
                value={seasonYear}
                onChange={(event) => setSeasonYear(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
              />
            </label>
          </div>

          <label>
            <p className="mb-2 text-sm text-slate-400">來源網址 / 球員 ID / 原始資料</p>
            <textarea
              value={sourceInput}
              onChange={(event) => {
                setSourceInput(event.target.value);
                resetPreview();
              }}
              rows={8}
              placeholder="貼上 MLB / MiLB / FanGraphs / MLB Pipeline 網址，或貼原始表格資料"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 font-mono text-sm"
            />
          </label>

          <button
            type="button"
            onClick={handleFetchPreview}
            disabled={isFetching}
            className="w-full rounded-xl bg-sky-600 px-4 py-3 font-bold hover:bg-sky-500 disabled:opacity-60"
          >
            {isFetching ? "抓取中..." : "產生預覽"}
          </button>

          <button
            type="button"
            onClick={handleImportSeasonStats}
            disabled={!seasonStatsPreview.length}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold hover:bg-emerald-500 disabled:opacity-60"
          >
            匯入 season_stats
          </button>

          <button
            type="button"
            onClick={handleImportTransactions}
            disabled={!transactionsPreview.length}
            className="w-full rounded-xl bg-amber-600 px-4 py-3 font-bold hover:bg-amber-500 disabled:opacity-60"
          >
            匯入 player_events
          </button>

          <button
            type="button"
            onClick={handleImportDailyReports}
            disabled={!gameLogsPreview.length}
            className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-bold hover:bg-cyan-500 disabled:opacity-60"
          >
            匯入 daily_reports
          </button>

          {message ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm">
              {message}
            </div>
          ) : null}
        </div>

        {preview.length > 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-bold">預覽資料</h2>
            <pre className="max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        ) : null}
      </section>
    </main>
  );
}