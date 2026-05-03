"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import AdminGuard from "@/src/components/AdminGuard";

type Player = {
  id: string;
  name_zh: string;
  name_en?: string;
  position?: string;
};

const emptyForm = {
  player_id: "",
  report_date: "",
  league: "",
  level: "",
  position: "",
  result: "",
  game_type: "regular",
  opponent: "",

  // 打者
  ab: "",
  pa: "",
  r: "",
  h: "",
  rbi: "",
  bb: "",
  k: "",
  hr: "",
  doubles: "",
  triples: "",
  sb: "",
  hbp: "",
  sf: "",

  // 投手
  ip: "",
  er: "",
  bf: "",
  pitch_count: "",
};

function toNumberOrNull(value: string) {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function NewDailyReportPage() {
  const [search, setSearch] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("id, name_zh, name_en, position")
        .order("name_zh", { ascending: true });

      if (error) {
        setMessage(`讀取球員失敗：${error.message}`);
        return;
      }

      setPlayers(data ?? []);
    }

    loadPlayers();
  }, []);

  const filteredPlayers = players.filter((p) =>
    `${p.name_zh}${p.name_en ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!form.player_id || !form.report_date) {
      setMessage("請選球員與日期");
      return;
    }

    const payload = {
      player_id: form.player_id,
      report_date: form.report_date,
      league: form.league || null,
      level: form.level || null,
      position: form.position || null,
      result: form.result || null,
      game_type: form.game_type || "regular",
      opponent: form.opponent || null,

      // 共用欄位
      ab: toNumberOrNull(form.ab),
      pa: toNumberOrNull(form.pa),
      r: toNumberOrNull(form.r),
      h: toNumberOrNull(form.h),
      rbi: toNumberOrNull(form.rbi),
      bb: toNumberOrNull(form.bb),
      k: toNumberOrNull(form.k),
      hr: toNumberOrNull(form.hr),
      doubles: toNumberOrNull(form.doubles),
      triples: toNumberOrNull(form.triples),
      sb: toNumberOrNull(form.sb),
      hbp: toNumberOrNull(form.hbp),
      sf: toNumberOrNull(form.sf),

      // 投手
      ip: toNumberOrNull(form.ip),
      er: toNumberOrNull(form.er),
      bf: toNumberOrNull(form.bf),
      pitch_count: toNumberOrNull(form.pitch_count),
    };

    const res = await fetch("/api/daily-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": password,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(`新增失敗：${result.error || "未知錯誤"}`);
      return;
    }

    setMessage("新增成功");
    setForm(emptyForm);
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
        <section className="max-w-3xl mx-auto">
          <a href="/admin" className="text-sm text-slate-400 hover:text-white">
            ← 回 Admin
          </a>

          <h1 className="mt-4 text-3xl font-bold">新增球員出賽紀錄</h1>

          <form
            onSubmit={submitReport}
            className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-6"
          >
            <div>
              <label className="text-sm text-slate-400">管理員密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">搜尋球員</label>
            
              <input
                placeholder="輸入姓名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
              />
            
              <div className="mt-2 max-h-40 overflow-y-auto border border-slate-700 rounded-xl">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => updateField("player_id", player.id)}
                    className={`p-3 cursor-pointer hover:bg-slate-700 ${
                      form.player_id === player.id ? "bg-blue-600" : ""
                    }`}
                  >
                    {player.name_zh}
                    {player.name_en ? ` ｜ ${player.name_en}` : ""}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="日期" type="date" name="report_date" value={form.report_date} onChange={updateField} />
              <Input label="守位" name="position" value={form.position} onChange={updateField} />
              <Input label="結果" name="result" value={form.result} onChange={updateField} />
              <Input label="對手" name="opponent" value={form.opponent} onChange={updateField} />
            </div>

            {/* 打者 */}
            <h2 className="text-xl font-bold">打者成績</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input label="AB" name="ab" value={form.ab} onChange={updateField} />
              <Input label="PA" name="pa" value={form.pa} onChange={updateField} />
              <Input label="R" name="r" value={form.r} onChange={updateField} />
              <Input label="H" name="h" value={form.h} onChange={updateField} />
              <Input label="RBI" name="rbi" value={form.rbi} onChange={updateField} />
              <Input label="BB" name="bb" value={form.bb} onChange={updateField} />
              <Input label="K" name="k" value={form.k} onChange={updateField} />
              <Input label="HR" name="hr" value={form.hr} onChange={updateField} />
              <Input label="2B" name="doubles" value={form.doubles} onChange={updateField} />
              <Input label="3B" name="triples" value={form.triples} onChange={updateField} />
              <Input label="SB" name="sb" value={form.sb} onChange={updateField} />
              <Input label="HBP" name="hbp" value={form.hbp} onChange={updateField} />
              <Input label="SF" name="sf" value={form.sf} onChange={updateField} />
            </div>

            {/* 投手 */}
            <h2 className="text-xl font-bold">投手成績</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input label="IP" name="ip" value={form.ip} onChange={updateField} />
              <Input label="ER" name="er" value={form.er} onChange={updateField} />
              <Input label="BF" name="bf" value={form.bf} onChange={updateField} />
              <Input label="投球數" name="pitch_count" value={form.pitch_count} onChange={updateField} />
            </div>

            <button className="w-full rounded-xl bg-sky-600 py-3 font-bold hover:bg-sky-500">
              新增出賽紀錄
            </button>

            {message && (
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm">
                {message}
              </div>
            )}
          </form>
        </section>
      </main>
    </AdminGuard>
  );
}

function Input({ label, name, value, onChange, type = "text" }: any) {
  return (
    <label>
      <div className="text-sm text-slate-400">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
      />
    </label>
  );
}