"use client";

import { useState } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setUnlocked(true);
      setError("");
      return;
    }

    setError("密碼錯誤");
  }

  if (unlocked) return <>{children}</>;

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <section className="max-w-md mx-auto rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Admin 驗證</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="輸入管理密碼"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
          />

          <button className="w-full rounded-xl bg-sky-600 py-3 font-bold hover:bg-sky-500">
            進入後台
          </button>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}