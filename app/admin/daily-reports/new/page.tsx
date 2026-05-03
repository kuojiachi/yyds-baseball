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

  ab: "",
  r: "",
  h: "",
  rbi: "",
  bb: "",
  so: "",
  hr: "",
  doubles: "",
  triples: "",
  sb: "",

  ip: "",
  er: "",
  bb_allowed: "",
  k: "",
  pitch_count: "",
};

function toNumberOrNull(value: string) {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function NewDailyReportPage() {
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

      ab: toNumberOrNull(form.ab),
      r: toNumberOrNull(form.r),
      h: toNumberOrNull(form.h),
      rbi: toNumberOrNull(form.rbi),
      bb: toNumberOrNull(form.bb),
      so: toNumberOrNull(form.so),
      hr: toNumberOrNull(form.hr),
      doubles: toNumberOrNull(form.doubles),
      triples: toNumberOrNull(form.triples),
      sb: toNumberOrNull(form.sb),

      ip: toNumberOrNull(form.ip),
      er: toNumberOrNull(form.er),
      bb_allowed: toNumberOrNull(form.bb_allowed),
      k: toNumberOrNull(form.k),
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
              <label className="text-sm text-slate-400">球員</label>
              <select
                value={form.player_id}
                onChange={(e) => updateField("player_id", e.target.value)}
                className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
              >
                <option value="">選擇球員</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name_zh} {player.name_en ? `｜${player.name_en}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              <Input label="日期" type="date" name="report_date" value={form.report_date} onChange={updateField} />
              <label>
                <div className="text-sm text-slate-400">當日聯盟</div>
                <select
                  value={form.league}
                  onChange={(e) => updateField("league", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                >
                  <option value="">選擇聯盟</option>
                  <option value="MLB">MLB</option>
                  <option value="NPB">NPB</option>
                  <option value="KBO">KBO</option>
                </select>
              </label>

              <label>
                <div className="text-sm text-slate-400">當日層級</div>
                <select
                  value={form.level}
                  onChange={(e) => updateField("level", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                >
                  <option value="">選擇層級</option>
                  <option value="MLB">MLB</option>
                  <option value="3A">3A</option>
                  <option value="2A">2A</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="Rk">Rk</option>
                  <option value="一軍">一軍</option>
                  <option value="二軍">二軍</option>
                  <option value="三軍">三軍</option>
                </select>
              </label>
              <Input label="守位" name="position" value={form.position} onChange={updateField} />
              <Input label="結果" name="result" value={form.result} onChange={updateField} />
              <Input label="對手" name="opponent" value={form.opponent} onChange={updateField} />
            </div>

            <label>
              <div className="text-sm text-slate-400">賽事類型</div>
              <select
                value={form.game_type}
                onChange={(e) => updateField("game_type", e.target.value)}
                className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
              >
                <option value="regular">例行賽</option>
                <option value="postseason">季後賽</option>
                <option value="spring">春訓</option>
                <option value="exhibition">熱身賽</option>
              </select>
            </label>

            <h2 className="text-xl font-bold">打者成績</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input label="AB" name="ab" value={form.ab} onChange={updateField} />
              <Input label="R" name="r" value={form.r} onChange={updateField} />
              <Input label="H" name="h" value={form.h} onChange={updateField} />
              <Input label="RBI" name="rbi" value={form.rbi} onChange={updateField} />
              <Input label="BB" name="bb" value={form.bb} onChange={updateField} />
              <Input label="SO" name="so" value={form.so} onChange={updateField} />
              <Input label="HR" name="hr" value={form.hr} onChange={updateField} />
              <Input label="2B" name="doubles" value={form.doubles} onChange={updateField} />
              <Input label="3B" name="triples" value={form.triples} onChange={updateField} />
              <Input label="SB" name="sb" value={form.sb} onChange={updateField} />
            </div>

            <h2 className="text-xl font-bold">投手成績</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input label="IP" name="ip" value={form.ip} onChange={updateField} />
              <Input label="ER" name="er" value={form.er} onChange={updateField} />
              <Input label="BB" name="bb_allowed" value={form.bb_allowed} onChange={updateField} />
              <Input label="K" name="k" value={form.k} onChange={updateField} />
              <Input label="投球數" name="pitch_count" value={form.pitch_count} onChange={updateField} />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 py-3 font-bold hover:bg-sky-500"
            >
              新增出賽紀錄
            </button>

            {message ? (
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm">
                {message}
              </div>
            ) : null}
          </form>
        </section>
      </main>
    </AdminGuard>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (name: string, value: string) => void;
}) {
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