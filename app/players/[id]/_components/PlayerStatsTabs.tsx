"use client";

import { useMemo, useState } from "react";

type PlayerStatsTabsProps = {
  player: any;
  playerReports: any[];
  playerEvents: any[];
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function displayValue(value: unknown) {
  const v = text(value);
  return v || "-";
}

function getYear(date: unknown) {
  const v = text(date);
  return v ? v.slice(0, 4) : "-";
}

function isPitcher(player: any) {
  const position = text(player.position).toLowerCase();
  return position.includes("投") || position.includes("pitcher") || position === "p";
}

function getLevel(report: any, player: any) {
  return displayValue(report.level || report.player_level || player.level);
}

function getTeam(report: any, player: any) {
  return displayValue(
    report.team_name ||
      report.team ||
      player.teams?.name_zh ||
      player.teams?.name_en ||
      player.team_name
  );
}

function safeDivide(top: number, bottom: number) {
  if (!bottom) return null;
  return top / bottom;
}

function formatRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(3).replace(/^0/, "");
}

function ipToOuts(ipValue: unknown) {
  const value = toNumber(ipValue);
  if (!value) return 0;

  const whole = Math.floor(value);
  const decimal = Math.round((value - whole) * 10);

  return whole * 3 + decimal;
}

function outsToIp(outs: number) {
  const whole = Math.floor(outs / 3);
  const rest = outs % 3;
  return `${whole}.${rest}`;
}

function getTotal(rows: any[]) {
  return rows.reduce(
    (sum: any, row: any) => {
      sum.games += toNumber(row.games);
      sum.ab += toNumber(row.ab);
      sum.r += toNumber(row.r);
      sum.h += toNumber(row.h);
      sum.rbi += toNumber(row.rbi);
      sum.bb += toNumber(row.bb);
      sum.so += toNumber(row.so);
      sum.hr += toNumber(row.hr);
      sum.doubles += toNumber(row.doubles);
      sum.triples += toNumber(row.triples);
      sum.sb += toNumber(row.sb);
      sum.ipOuts += toNumber(row.ipOuts);
      sum.er += toNumber(row.er);
      sum.bbAllowed += toNumber(row.bbAllowed);
      sum.k += toNumber(row.k);
      sum.pitchCount += toNumber(row.pitchCount);
      return sum;
    },
    {
      games: 0,
      ab: 0,
      r: 0,
      h: 0,
      rbi: 0,
      bb: 0,
      so: 0,
      hr: 0,
      doubles: 0,
      triples: 0,
      sb: 0,
      ipOuts: 0,
      er: 0,
      bbAllowed: 0,
      k: 0,
      pitchCount: 0,
    }
  );
}

function getEventContent(event: any) {
  return displayValue(
    event.note ||
      event.to_team ||
      event.to_level ||
      event.status ||
      event.event_type
  );
}

const LEVEL_ORDER = ["MLB", "3A", "2A", "A+", "1A", "RK", "一軍", "二軍", "三軍"];

export default function PlayerStatsTabs({
  player,
  playerReports,
  playerEvents,
}: PlayerStatsTabsProps) {
  const [activeTab, setActiveTab] = useState("current");
  const [levelFilter, setLevelFilter] = useState("全部");
  const [yearFilter, setYearFilter] = useState("全部");
  const pitcher = isPitcher(player);

  const filteredReports = useMemo(() => {
    if (levelFilter === "全部") return playerReports;

    return playerReports.filter((report) => {
      return getLevel(report, player) === levelFilter;
    });
  }, [levelFilter, playerReports, player]);

  const historyRows = useMemo(() => {
    const map: Record<string, any> = {};

    for (const report of filteredReports) {
      const year = getYear(report.report_date);
      const team = getTeam(report, player);
      const level = getLevel(report, player);
      const key = `${year}-${team}-${level}`;

      if (!map[key]) {
        map[key] = {
          year,
          team,
          level,
          games: 0,
          ab: 0,
          r: 0,
          h: 0,
          rbi: 0,
          bb: 0,
          so: 0,
          hr: 0,
          doubles: 0,
          triples: 0,
          sb: 0,
          ipOuts: 0,
          er: 0,
          bbAllowed: 0,
          k: 0,
          pitchCount: 0,
        };
      }

      map[key].games += 1;

      map[key].ab += toNumber(report.ab);
      map[key].r += toNumber(report.r);
      map[key].h += toNumber(report.h);
      map[key].rbi += toNumber(report.rbi);
      map[key].bb += toNumber(report.bb);
      map[key].so += toNumber(report.so);
      map[key].hr += toNumber(report.hr);
      map[key].doubles += toNumber(report.doubles);
      map[key].triples += toNumber(report.triples);
      map[key].sb += toNumber(report.sb);

      map[key].ipOuts += ipToOuts(report.ip);
      map[key].er += toNumber(report.er);
      map[key].bbAllowed += toNumber(report.bb_allowed);
      map[key].k += toNumber(report.k);
      map[key].pitchCount += toNumber(report.pitch_count);
    }

    return Object.values(map).sort((a: any, b: any) => {
      return Number(b.year) - Number(a.year);
    });
  }, [filteredReports, player]);
  
  const levelOptions = useMemo(() => {
    const levels = Array.from(
      new Set(historyRows.map((row: any) => String(row.level)).filter(Boolean))
    );

    return [
      "全部",
      ...levels.sort((a, b) => {
        const aIndex = LEVEL_ORDER.indexOf(a);
        const bIndex = LEVEL_ORDER.indexOf(b);

        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      }),
    ];
  }, [historyRows]);

  const yearOptions = useMemo(() => {
    const years = Array.from(
        new Set(historyRows.map((row: any) => String(row.year)).filter(Boolean))
    );

    return ["全部", ...years.sort((a, b) => Number(b) - Number(a))];
  }, [historyRows]);

  const filteredHistoryRows = useMemo(() => {
    if (yearFilter === "全部") return historyRows;

    return historyRows.filter((row: any) => {
        return String(row.year) === yearFilter;
    });
  }, [historyRows, yearFilter]);

  const currentYear = String(new Date().getFullYear());

  const currentRows = useMemo(() => {
    return historyRows.filter((row: any) => {
      return String(row.year) === currentYear;
    });
  }, [historyRows, currentYear]);

  const currentTotal = getTotal(currentRows);
  const historyTotal = getTotal(filteredHistoryRows);

  return (
    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
    <div className="border-b border-slate-800 p-3 md:hidden">
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="w-full rounded-none bg-slate-800 px-4 py-3 font-bold text-white"
      >
        <option value="current">今年成績</option>
        <option value="history">歷年成績</option>
        <option value="games">逐場紀錄</option>
        <option value="events">球員狀態總覽</option>
      </select>
    </div>

    <div className="hidden md:grid md:grid-cols-4 border-b border-slate-800 text-sm">
      <TabButton active={activeTab === "current"} onClick={() => setActiveTab("current")}>
        今年成績
      </TabButton>

      <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
        歷年成績
      </TabButton>

      <TabButton active={activeTab === "games"} onClick={() => setActiveTab("games")}>
        逐場紀錄
      </TabButton>

      <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")}>
        球員狀態總覽
      </TabButton>
    </div>

      <div className="p-5">
        {(activeTab === "current" || activeTab === "history") ? (
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        >
          {levelOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

      {activeTab === "history" ? (
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
            {year}
              </option>
          ))}
        </select>
      ) : null}
    </div>
      ) : null}

        <div className="overflow-x-auto">
          {activeTab === "current" ? (
            pitcher ? (
              <PitcherTable rows={currentRows} total={currentTotal} />
            ) : (
              <HitterTable rows={currentRows} total={currentTotal} />
            )
          ) : null}

          {activeTab === "history" ? (
            pitcher ? (
              <PitcherTable rows={filteredHistoryRows} total={historyTotal} />
            ) : (
              <HitterTable rows={filteredHistoryRows} total={historyTotal} />
            )
          ) : null}

          {activeTab === "games" ? (
            <GameList reports={playerReports} />
          ) : null}

          {activeTab === "events" ? (
            <EventList events={playerEvents} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-5 py-3 text-center whitespace-nowrap ${
        active
          ? "bg-slate-800 text-white font-bold"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function HitterTable({ rows, total }: { rows: any[]; total: any }) {
  return (
    <table className="min-w-[1100px] w-full text-sm">
      <thead className="bg-slate-800 text-slate-300">
        <tr>
          {["年度", "球隊", "層級", "出賽", "打數", "得分", "安打", "二安", "三安", "全壘打", "打點", "四壞", "三振", "盜壘", "AVG", "OBP", "SLG", "OPS"].map((h) => (
            <th key={h} className="p-3 text-left whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => {
          const avg = safeDivide(row.h, row.ab);
          const obp = safeDivide(row.h + row.bb, row.ab + row.bb);
          const tb = row.h + row.doubles + row.triples * 2 + row.hr * 3;
          const slg = safeDivide(tb, row.ab);
          const ops = obp === null && slg === null ? null : (obp ?? 0) + (slg ?? 0);

          return (
            <tr key={`${row.year}-${row.team}-${row.level}`} className="border-t border-slate-800">
              <td className="p-3">{row.year}</td>
              <td className="p-3">{row.team}</td>
              <td className="p-3">{row.level}</td>
              <td className="p-3">{row.games}</td>
              <td className="p-3">{row.ab}</td>
              <td className="p-3">{row.r}</td>
              <td className="p-3">{row.h}</td>
              <td className="p-3">{row.doubles}</td>
              <td className="p-3">{row.triples}</td>
              <td className="p-3">{row.hr}</td>
              <td className="p-3">{row.rbi}</td>
              <td className="p-3">{row.bb}</td>
              <td className="p-3">{row.so}</td>
              <td className="p-3">{row.sb}</td>
              <td className="p-3">{formatRate(avg)}</td>
              <td className="p-3">{formatRate(obp)}</td>
              <td className="p-3">{formatRate(slg)}</td>
              <td className="p-3">{formatRate(ops)}</td>
            </tr>
          );
        })}

        <tr className="border-t border-slate-700 bg-slate-800/50 font-bold">
          <td className="p-3">{rows[0]?.year || new Date().getFullYear()}</td>
          <td className="p-3">-</td>
          <td className="p-3">-</td>
          <td className="p-3">{total.games}</td>
          <td className="p-3">{total.ab}</td>
          <td className="p-3">{total.r}</td>
          <td className="p-3">{total.h}</td>
          <td className="p-3">{total.doubles}</td>
          <td className="p-3">{total.triples}</td>
          <td className="p-3">{total.hr}</td>
          <td className="p-3">{total.rbi}</td>
          <td className="p-3">{total.bb}</td>
          <td className="p-3">{total.so}</td>
          <td className="p-3">{total.sb}</td>
          <td className="p-3">{formatRate(safeDivide(total.h, total.ab))}</td>
          <td className="p-3">{formatRate(safeDivide(total.h + total.bb, total.ab + total.bb))}</td>
          <td className="p-3">{formatRate(safeDivide(total.h + total.doubles + total.triples * 2 + total.hr * 3, total.ab))}</td>
          <td className="p-3">-</td>
        </tr>
      </tbody>
    </table>
  );
}

function PitcherTable({ rows, total }: { rows: any[]; total: any }) {
  return (
    <table className="min-w-[900px] w-full text-sm">
      <thead className="bg-slate-800 text-slate-300">
        <tr>
          {["年度", "球隊", "層級", "出賽", "局數", "責失", "四壞", "三振", "投球數", "ERA", "WHIP"].map((h) => (
            <th key={h} className="p-3 text-left whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => {
          const ip = row.ipOuts / 3;
          const era = safeDivide(row.er * 9, ip);
          const whip = safeDivide(row.bbAllowed, ip);

          return (
            <tr key={`${row.year}-${row.team}-${row.level}`} className="border-t border-slate-800">
              <td className="p-3">{row.year}</td>
              <td className="p-3">{row.team}</td>
              <td className="p-3">{row.level}</td>
              <td className="p-3">{row.games}</td>
              <td className="p-3">{outsToIp(row.ipOuts)}</td>
              <td className="p-3">{row.er}</td>
              <td className="p-3">{row.bbAllowed}</td>
              <td className="p-3">{row.k}</td>
              <td className="p-3">{row.pitchCount}</td>
              <td className="p-3">{era === null ? "-" : era.toFixed(2)}</td>
              <td className="p-3">{whip === null ? "-" : whip.toFixed(2)}</td>
            </tr>
          );
        })}

        <tr className="border-t border-slate-700 bg-slate-800/50 font-bold">
          <td className="p-3">{rows[0]?.year || new Date().getFullYear()}</td>
          <td className="p-3">-</td>
          <td className="p-3">-</td>
          <td className="p-3">{total.games}</td>
          <td className="p-3">{outsToIp(total.ipOuts)}</td>
          <td className="p-3">{total.er}</td>
          <td className="p-3">{total.bbAllowed}</td>
          <td className="p-3">{total.k}</td>
          <td className="p-3">{total.pitchCount}</td>
          <td className="p-3">{safeDivide(total.er * 9, total.ipOuts / 3)?.toFixed(2) ?? "-"}</td>
          <td className="p-3">{safeDivide(total.bbAllowed, total.ipOuts / 3)?.toFixed(2) ?? "-"}</td>
        </tr>
      </tbody>
    </table>
  );
}

function GameList({ reports }: { reports: any[] }) {
  if (!reports.length) {
    return <div className="p-5 text-slate-400">目前沒有出賽紀錄</div>;
  }

  return (
    <div className="divide-y divide-slate-800">
      {reports.map((report) => (
        <div key={report.id || `${report.report_date}-${report.result}`} className="grid grid-cols-[120px_1fr] gap-4 p-4">
          <div className="text-sm text-slate-400">
            {displayValue(report.report_date)}
          </div>

          <div className="font-bold text-white">
            {displayValue(report.result || report.stats || "出賽")}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventList({ events }: { events: any[] }) {
  if (!events.length) {
    return <div className="p-5 text-slate-400">目前沒有狀態紀錄</div>;
  }

  return (
    <div className="divide-y divide-slate-800">
      {events.map((event) => (
        <div key={event.id || `${event.event_date}-${event.event_type}`} className="grid grid-cols-[120px_1fr] gap-4 p-4">
          <div className="text-sm text-slate-400">
            {displayValue(event.event_date)}
          </div>

          <div className="font-bold text-white">
            {getEventContent(event)}
          </div>
        </div>
      ))}
    </div>
  );
}