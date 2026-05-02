"use client";

import { useState } from "react";

export default function AdminImportButtons() {
  const [loading, setLoading] = useState<"daily" | "events" | null>(null);

  async function runImport(type: "daily" | "events") {
    setLoading(type);

    try {
      const res = await fetch(`/api/import/${type}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!data.success) {
        alert(`匯入失敗：${data.error || "未知錯誤"}`);
        return;
      }

      alert("匯入成功");
      window.location.reload();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => runImport("daily")}
        disabled={loading !== null}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50"
      >
        {loading === "daily" ? "匯入中..." : "匯入戰報"}
      </button>

      <button
        type="button"
        onClick={() => runImport("events")}
        disabled={loading !== null}
        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {loading === "events" ? "匯入中..." : "匯入異動"}
      </button>
    </div>
  );
}