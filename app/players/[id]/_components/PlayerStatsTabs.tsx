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

function displayGameType(value: unknown) {
  const type = text(value || "regular");

  if (type === "regular") return "例行賽";
  if (type === "postseason") return "季後賽";
  if (type === "spring") return "春訓";
  if (type === "exhibition") return "熱身賽";

  return type || "-";
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
  const value = text(ipValue);
  if (!value) return 0;

  const [wholeText, decimalText = "0"] = value.split(".");
  const whole = Number(wholeText);
  const decimal = Number(decimalText);

  if (!Number.isFinite(whole)) return 0;

  return whole * 3 + (decimal === 1 ? 1 : decimal === 2 ? 2 : 0);
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
      sum.pa += toNumber(row.pa);
      sum.r += toNumber(row.r);
      sum.h += toNumber(row.h);
      sum.rbi += toNumber(row.rbi);
      sum.bb += toNumber(row.bb);
      sum.k += toNumber(row.k);
      sum.hr += toNumber(row.hr);
      sum.doubles += toNumber(row.doubles);
      sum.triples += toNumber(row.triples);
      sum.sb += toNumber(row.sb);
      sum.hbp += toNumber(row.hbp);
      sum.sf += toNumber(row.sf);

      sum.ipOuts += toNumber(row.ipOuts);
      sum.er += toNumber(row.er);
      sum.bf += toNumber(row.bf);
      sum.pitchCount += toNumber(row.pitchCount);

      return sum;
    },
    {
      games: 0,
      ab: 0,
      pa: 0,
      r: 0,
      h: 0,
      rbi: 0,
      bb: 0,
      k: 0,
      hr: 0,
      doubles: 0,
      triples: 0,
      sb: 0,
      hbp: 0,
      sf: 0,
      ipOuts: 0,
      er: 0,
      bf: 0,
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
      if (activeTab === "current") {
        const type = report.game_type || "regular";
        if (type !== "regular") continue;
      }

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
          pa: 0,
          r: 0,
          h: 0,
          rbi: 0,
          bb: 0,
          k: 0,
          hr: 0,
          doubles: 0,
          triples: 0,
          sb: 0,
          hbp: 0,
          sf: 0,
          ipOuts: 0,
          er: 0,
          bf: 0,
          pitchCount: 0,
        };
      }

      map[key].games += 1;

      map[key].ab += toNumber(report.ab);
      map[key].pa += toNumber(report.pa);
      map[key].r += toNumber(report.r);
      map[key].h += toNumber(report.h);
      map[key].rbi += toNumber(report.rbi);
      map[key].bb += toNumber(report.bb);
      map[key].k += toNumber(report.k);
      map[key].hr += toNumber(report.hr);
      map[key].doubles += toNumber(report.doubles);
      map[key].triples += toNumber(report.triples);
      map[key].sb += toNumber(report.sb);
      map[key].hbp += toNumber(report.hbp);
      map[key].sf += toNumber(report.sf);

      map[key].ipOuts += ipToOuts(report.ip);
      map[key].er += toNumber(report.er);
      map[key].bf += toNumber(report.bf);
      map[key].pitchCount += toNumber(report.pitch_count);
    }

    return Object.values(map).sort((a: any, b: any) => {
      const yearDiff = Number(b.year) - Number(a.year);
      if (yearDiff !== 0) return yearDiff;

      const teamDiff = String(a.team).localeCompare(String(b.team));
      if (teamDiff !== 0) return teamDiff;

      const aLevelIndex = LEVEL_ORDER.indexOf(String(a.level));
      const bLevelIndex = LEVEL_ORDER.indexOf(String(b.level));

      const aRank = aLevelIndex === -1 ? 999 : aLevelIndex;
      const bRank = bLevelIndex === -1 ? 999 : bLevelIndex;

      return aRank - bRank;
    });
  }, [filteredReports, player, activeTab]);

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
        {activeTab === "current" || activeTab === "history" ? (
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

          {activeTab === "games" ? <GameList reports={playerReports} /> : null}

          {activeTab === "events" ? <EventList events={playerEvents} /> : null}
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
    <table className="min-w-[1250px] w-full text-sm">
      <thead className="bg-slate-800 text-slate-300">
        <tr>
          {[
            "年度",
            "球隊",
            "層級",
            "出賽",
            "打數",
            "打席",
            "得分",
            "安打",
            "二安",
            "三安",
            "全壘打",
            "打點",
            "四壞",
            "三振",
            "盜壘",
            "HBP",
            "SF",
            "AVG",
            "OBP",
            "SLG",
            "OPS",
            "ISO",
            "BABIP",
            "K%",
            "BB%",
          ].map((h) => (
            <th key={h} className="p-3 text-left whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => {
          const avg = safeDivide(row.h, row.ab);

          const obp = safeDivide(
             row.h + row.bb + row.hbp,
             row.pa
          );

          const singles = row.h - row.doubles - row.triples - row.hr;
          const tb = singles + row.doubles * 2 + row.triples * 3 + row.hr * 4;
          const slg = safeDivide(tb, row.ab);
          const ops = obp === null && slg === null ? null : (obp ?? 0) + (slg ?? 0);
          const iso = slg === null || avg === null ? null : slg - avg;
          const babip = safeDivide(
            row.h - row.hr,
            row.ab - row.k - row.hr + row.sf
          );
          const kRate = safeDivide(row.k, row.pa);
          const bbRate = safeDivide(row.bb, row.pa);

          return (
            <tr key={`${row.year}-${row.team}-${row.level}`} className="border-t border-slate-800">
              <td className="p-3">{row.year}</td>
              <td className="p-3">{row.team}</td>
              <td className="p-3">{row.level}</td>
              <td className="p-3">{row.games}</td>
              <td className="p-3">{row.ab}</td>
              <td className="p-3">{row.pa}</td>
              <td className="p-3">{row.r}</td>
              <td className="p-3">{row.h}</td>
              <td className="p-3">{row.doubles}</td>
              <td className="p-3">{row.triples}</td>
              <td className="p-3">{row.hr}</td>
              <td className="p-3">{row.rbi}</td>
              <td className="p-3">{row.bb}</td>
              <td className="p-3">{row.k}</td>
              <td className="p-3">{row.sb}</td>
              <td className="p-3">{row.hbp}</td>
              <td className="p-3">{row.sf}</td>
              <td className="p-3">{formatRate(avg)}</td>
              <td className="p-3">{formatRate(obp)}</td>
              <td className="p-3">{formatRate(slg)}</td>
              <td className="p-3">{formatRate(ops)}</td>
              <td className="p-3">{formatRate(iso)}</td>
              <td className="p-3">{formatRate(babip)}</td>
              <td className="p-3">{formatRate(kRate)}</td>
              <td className="p-3">{formatRate(bbRate)}</td>
            </tr>
          );
        })}

        <HitterTotalRow rows={rows} total={total} />
      </tbody>
    </table>
  );
}

function HitterTotalRow({ rows, total }: { rows: any[]; total: any }) {
  const avg = safeDivide(total.h, total.ab);

  const obp = safeDivide(
    total.h + total.bb + total.hbp,
    total.pa
  );

  const singles = total.h - total.doubles - total.triples - total.hr;
  const tb = singles + total.doubles * 2 + total.triples * 3 + total.hr * 4;
  const slg = safeDivide(tb, total.ab);
  const ops = obp === null && slg === null ? null : (obp ?? 0) + (slg ?? 0);
  const iso = slg === null || avg === null ? null : slg - avg;
  const babip = safeDivide(
    total.h - total.hr,
    total.ab - total.k - total.hr + total.sf
  );
  const kRate = safeDivide(total.k, total.pa);
  const bbRate = safeDivide(total.bb, total.pa);

  return (
    <tr className="border-t border-slate-700 bg-slate-800/50 font-bold">
      <td className="p-3">{rows[0]?.year || new Date().getFullYear()}</td>
      <td className="p-3">合計</td>
      <td className="p-3">-</td>
      <td className="p-3">{total.games}</td>
      <td className="p-3">{total.ab}</td>
      <td className="p-3">{total.pa}</td>
      <td className="p-3">{total.r}</td>
      <td className="p-3">{total.h}</td>
      <td className="p-3">{total.doubles}</td>
      <td className="p-3">{total.triples}</td>
      <td className="p-3">{total.hr}</td>
      <td className="p-3">{total.rbi}</td>
      <td className="p-3">{total.bb}</td>
      <td className="p-3">{total.k}</td>
      <td className="p-3">{total.sb}</td>
      <td className="p-3">{total.hbp}</td>
      <td className="p-3">{total.sf}</td>
      <td className="p-3">{formatRate(avg)}</td>
      <td className="p-3">{formatRate(obp)}</td>
      <td className="p-3">{formatRate(slg)}</td>
      <td className="p-3">{formatRate(ops)}</td>
      <td className="p-3">{formatRate(iso)}</td>
      <td className="p-3">{formatRate(babip)}</td>
      <td className="p-3">{formatRate(kRate)}</td>
      <td className="p-3">{formatRate(bbRate)}</td>
    </tr>
  );
}

function PitcherTable({ rows, total }: { rows: any[]; total: any }) {
  return (
    <table className="min-w-[1150px] w-full text-sm">
      <thead className="bg-slate-800 text-slate-300">
        <tr>
          {[
            "年度",
            "球隊",
            "層級",
            "出賽",
            "局數",
            "責失",
            "被安打",
            "四壞",
            "三振",
            "BF",
            "投球數",
            "ERA",
            "WHIP",
            "K/9",
            "BB/9",
            "K/BB",
            "K%",
            "BB%",
            "BABIP",
          ].map((h) => (
            <th key={h} className="p-3 text-left whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => {
          const ip = row.ipOuts / 3;
          const era = safeDivide(row.er * 9, ip);
          const whip = safeDivide(row.bb + row.h, ip);
          const k9 = safeDivide(row.k * 9, ip);
          const bb9 = safeDivide(row.bb * 9, ip);
          const kbb = safeDivide(row.k, row.bb);
          const kRate = safeDivide(row.k, row.bf);
          const bbRate = safeDivide(row.bb, row.bf);
          const babip = safeDivide(
            row.h - row.hr,
            row.bf - row.k - row.bb - row.hbp - row.hr
          );

          return (
            <tr key={`${row.year}-${row.team}-${row.level}`} className="border-t border-slate-800">
              <td className="p-3">{row.year}</td>
              <td className="p-3">{row.team}</td>
              <td className="p-3">{row.level}</td>
              <td className="p-3">{row.games}</td>
              <td className="p-3">{outsToIp(row.ipOuts)}</td>
              <td className="p-3">{row.er}</td>
              <td className="p-3">{row.h}</td>
              <td className="p-3">{row.bb}</td>
              <td className="p-3">{row.k}</td>
              <td className="p-3">{row.bf}</td>
              <td className="p-3">{row.pitchCount}</td>
              <td className="p-3">{era === null ? "-" : era.toFixed(2)}</td>
              <td className="p-3">{whip === null ? "-" : whip.toFixed(2)}</td>
              <td className="p-3">{k9 === null ? "-" : k9.toFixed(2)}</td>
              <td className="p-3">{bb9 === null ? "-" : bb9.toFixed(2)}</td>
              <td className="p-3">{kbb === null ? "-" : kbb.toFixed(2)}</td>
              <td className="p-3">{formatRate(kRate)}</td>
              <td className="p-3">{formatRate(bbRate)}</td>
              <td className="p-3">{formatRate(babip)}</td>
            </tr>
          );
        })}

        <PitcherTotalRow rows={rows} total={total} />
      </tbody>
    </table>
  );
}

function PitcherTotalRow({ rows, total }: { rows: any[]; total: any }) {
  const ip = total.ipOuts / 3;
  const era = safeDivide(total.er * 9, ip);
  const whip = safeDivide(total.bb + total.h, ip);
  const k9 = safeDivide(total.k * 9, ip);
  const bb9 = safeDivide(total.bb * 9, ip);
  const kbb = safeDivide(total.k, total.bb);
  const kRate = safeDivide(total.k, total.bf);
  const bbRate = safeDivide(total.bb, total.bf);
  const babip = safeDivide(
    total.h - total.hr,
    total.bf - total.k - total.bb - total.hbp - total.hr
  );

  return (
    <tr className="border-t border-slate-700 bg-slate-800/50 font-bold">
      <td className="p-3">{rows[0]?.year || new Date().getFullYear()}</td>
      <td className="p-3">合計</td>
      <td className="p-3">-</td>
      <td className="p-3">{total.games}</td>
      <td className="p-3">{outsToIp(total.ipOuts)}</td>
      <td className="p-3">{total.er}</td>
      <td className="p-3">{total.h}</td>
      <td className="p-3">{total.bb}</td>
      <td className="p-3">{total.k}</td>
      <td className="p-3">{total.bf}</td>
      <td className="p-3">{total.pitchCount}</td>
      <td className="p-3">{era === null ? "-" : era.toFixed(2)}</td>
      <td className="p-3">{whip === null ? "-" : whip.toFixed(2)}</td>
      <td className="p-3">{k9 === null ? "-" : k9.toFixed(2)}</td>
      <td className="p-3">{bb9 === null ? "-" : bb9.toFixed(2)}</td>
      <td className="p-3">{kbb === null ? "-" : kbb.toFixed(2)}</td>
      <td className="p-3">{formatRate(kRate)}</td>
      <td className="p-3">{formatRate(bbRate)}</td>
      <td className="p-3">{formatRate(babip)}</td>
    </tr>
  );
}

function GameList({ reports }: { reports: any[] }) {
  if (!reports.length) {
    return <div className="p-5 text-slate-400">目前沒有出賽紀錄</div>;
  }

  return (
    <div className="divide-y divide-slate-800">
      {reports.map((report) => (
        <div
          key={report.id || `${report.report_date}-${report.result}`}
          className="p-4 border-b border-slate-800"
        >
          <div className="text-sm text-slate-400">
            {displayValue(report.report_date)}　{displayGameType(report.game_type)}｜
            {displayValue(report.team_name || report.team)}｜
            {displayValue(report.level)}｜{displayValue(report.opponent || "對手")}
          </div>

          <div className="mt-1 font-bold text-white">
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
        <div
          key={event.id || `${event.event_date}-${event.event_type}`}
          className="grid grid-cols-[120px_1fr] gap-4 p-4"
        >
          <div className="text-sm text-slate-400">
            {displayValue(event.event_date)}
          </div>

          <div className="font-bold text-white">{getEventContent(event)}</div>
        </div>
      ))}
    </div>
  );
}