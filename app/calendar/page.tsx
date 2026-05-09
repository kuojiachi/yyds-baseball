import Link from "next/link";

import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getDailyReports } from "@/src/lib/dailyReports";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function getTaiwanTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getMonthDays(month: string) {
  const [year, monthText] = month.split("-").map(Number);
  const firstDay = new Date(year, monthText - 1, 1);
  const lastDay = new Date(year, monthText, 0);
  const days = [];

  const startPadding = firstDay.getDay();

  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = `${year}-${String(monthText).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push(date);
  }

  return days;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; month?: string; year?: string; monthNumber?: string }>;
}) {
  const params = await searchParams;

  const players = await getPlayers();
  const reports = await getDailyReports();
  const events = await getPlayerEvents();

  const today = getTaiwanTodayDate();
  const year = params?.year || params?.month?.slice(0, 4) || params?.date?.slice(0, 4) || today.slice(0, 4);
  const monthNumber = params?.monthNumber || params?.month?.slice(5, 7) || params?.date?.slice(5, 7) || today.slice(5, 7);

  const selectedMonth = `${year}-${monthNumber}`;
  const selectedDate = params?.date || `${selectedMonth}-01`;
  const playerNameOptions = getPlayerNameOptions(players as any);

  const monthDays = getMonthDays(selectedMonth);

  const eventCountByDate = new Map<string, number>();
  for (const event of events as any[]) {
    const date = String(event.event_date || "").slice(0, 10);
    if (!date.startsWith(selectedMonth)) continue;
    eventCountByDate.set(date, (eventCountByDate.get(date) || 0) + 1);
  }

  const reportCountByDate = new Map<string, number>();
  for (const report of reports as any[]) {
    const date = String(report.report_date || "").slice(0, 10);
    if (!date.startsWith(selectedMonth)) continue;
    reportCountByDate.set(date, (reportCountByDate.get(date) || 0) + 1);
  }

  const dayEvents = (events as any[]).filter(
    (event) => String(event.event_date || "").slice(0, 10) === selectedDate
  );

  const dayReports = (reports as any[]).filter(
    (report) => String(report.report_date || "").slice(0, 10) === selectedDate
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <section className="w-full max-w-7xl mx-auto">
        <SiteHeader
          subtitle="狀態異動與出賽日曆"
          showSearch
          playerNameOptions={playerNameOptions as any}
        />

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <form className="flex flex-wrap items-end gap-3">
            <label>
              <p className="mb-2 text-sm text-slate-400">選擇月份</p>
              <select
                name="year"
                defaultValue={selectedMonth.slice(0, 4)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              >
                {Array.from(
                  { length: new Date().getFullYear() - 2010 + 1 },
                  (_, i) => String(new Date().getFullYear() - i)
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                name="monthNumber"
                defaultValue={selectedMonth.slice(5, 7)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((month) => (
                  <option key={month} value={month}>
                    {month} 月
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-500"
            >
              切換月份
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden mb-6">
          <div className="grid grid-cols-7 bg-slate-800 text-center text-sm font-bold text-slate-300">
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <div key={day} className="p-3 border-r border-slate-700 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((date, index) => {
              const eventCount = date ? eventCountByDate.get(date) || 0 : 0;
              const reportCount = date ? reportCountByDate.get(date) || 0 : 0;
              const isSelected = date === selectedDate;
              const isToday = date === today;

              return (
                <div
                  key={date || `empty-${index}`}
                  className={[
                    "min-h-[120px] border-r border-b border-slate-800 p-3",
                    isSelected ? "bg-sky-900/40" : "bg-slate-900",
                    date ? "hover:bg-slate-800/70" : "bg-slate-950/60",
                  ].join(" ")}
                >
                  {date ? (
                    <Link
                      href={`/calendar?month=${date.slice(0, 7)}&date=${date}`}
                      className="block h-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className={isToday ? "font-bold text-sky-300" : "font-bold"}>
                          {Number(date.slice(8, 10))}
                        </span>
                        {isToday ? (
                          <span className="text-xs text-sky-300">今天</span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        {eventCount > 0 ? (
                          <div className="rounded-lg bg-amber-500/15 px-2 py-1 text-amber-200">
                            異動 {eventCount}
                          </div>
                        ) : null}

                        {reportCount > 0 ? (
                          <div className="rounded-lg bg-emerald-500/15 px-2 py-1 text-emerald-200">
                            出賽 {reportCount}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-800 p-5">
              <h2 className="text-xl font-bold">{selectedDate} 狀態異動</h2>
            </div>

            <div className="divide-y divide-slate-800">
              {dayEvents.length ? (
                dayEvents.map((event: any) => (
                  <div key={event.id} className="p-4">
                    <div className="font-bold text-sky-300">{event.name_zh || "-"}</div>
                    <div className="mt-1 text-sm text-slate-300">
                      {event.note || event.to_team || event.event_type || "-"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-slate-400">這天沒有狀態異動</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-800 p-5">
              <h2 className="text-xl font-bold">{selectedDate} 出賽紀錄</h2>
            </div>

            <div className="divide-y divide-slate-800">
              {dayReports.length ? (
                dayReports.map((report: any) => (
                  <div key={report.id} className="p-4">
                    <Link
                      href={`/players/${report.player_id}?tab=games&date=${selectedDate}`}
                      className="font-bold text-sky-300 hover:underline"
                    >
                      {report.name_zh || report.players?.name_zh || "-"}
                    </Link>

                    <div className="mt-1 text-sm text-slate-300">
                      {report.team_name || report.players?.team_name || "-"}｜{" "}
                      {report.level || report.players?.level || "-"}｜{" "}
                      {report.result || report.stats || "-"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-slate-400">這天沒有出賽紀錄</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}