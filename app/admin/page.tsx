import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import AdminImportButtons from "./AdminImportButtons";
import AdminGuard from "@/src/components/AdminGuard";

export default async function AdminPage() {
  const players = await getPlayers();
  const reports = await getDailyReports();
  const events = await getPlayerEvents();
  const playerNameOptions = getPlayerNameOptions(players as any);

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
        <section className="max-w-5xl mx-auto">
          <SiteHeader
            subtitle="TWDS Admin"
            showSearch
            playerNameOptions={playerNameOptions as any}
          />

          <h1 className="text-3xl font-bold">TWDS Admin</h1>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">資料狀態</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                球員：{players.length}
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                戰報：{reports.length}
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                異動：{events.length}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">匯入工具</h2>
            <p className="mt-1 text-sm text-slate-400">
              先把 CSV 匯入暫存表，再按下方按鈕轉進正式表。
            </p>

            <AdminImportButtons />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">快速入口</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href="/" className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
                回首頁
              </a>
              <a href="/players" className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
                球員總表
              </a>
              <a href="/today" className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
                球員出賽紀錄
              </a>
              <a href="/admin/daily-reports/new" className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
                新增球員出賽紀錄
              </a>
              <a href="/admin/season-stats" className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
                Season Stats 匯入
              </a>
            </div>
          </div>

          <a href="/admin/import" className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
            CSV 上傳
          </a>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">最近異動</h2>

            <div className="mt-3 space-y-2">
              {events.length === 0 ? (
                <div className="text-slate-400">目前沒有異動資料</div>
              ) : (
                events.slice(0, 10).map((event: any) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm"
                  >
                    {event.event_date}｜{event.name_zh || "-"}｜
                    {event.event_type || "異動"}｜{event.note || "-"}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </AdminGuard>
  );
}