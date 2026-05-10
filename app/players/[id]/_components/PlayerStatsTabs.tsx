"use client";

import { useSearchParams } from "next/navigation";
import { normalizeLevel } from "@/src/utils/playerEvents";
import React, { useEffect, useMemo, useState } from "react";
import PlayerScoutingReports from "./PlayerScoutingReports";

type PlayerStatsTabsProps = {
  player: any;
  playerReports: any[];
  playerEvents: any[];
  scoutingReports: any[];
  currentSeasonStats?: any[];
  seasonStats?: any[];
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

function displayTeamName(team?: string | null) {
  const value = String(team ?? "").trim();
  if (!value) return "-";
  return value.split("-")[0];
}

function isPitcher(player: any) {
  const position = text(player.position).toLowerCase();
  return position.includes("投") || position.includes("pitcher") || position === "p";
}

function safeDivide(top: number, bottom: number) {
  if (!bottom) return null;
  return top / bottom;
}

function formatRate(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(3).replace(/^0/, "");
}

function formatDecimal(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(2);
}

function formatPercent(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${(n * 100).toFixed(1)}%`;
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

const LEVEL_ORDER = [
  "MLB",
  "AAA",
  "3A",
  "AA",
  "2A",
  "A+",
  "High-A",
  "A",
  "1A",
  "ROK",
  "RK",
  "日職一軍",
  "日職二軍",
  "日職三軍",
  "韓職一軍",
  "韓職二軍",
];

function sortLevel(a: string, b: string) {
  const aIndex = LEVEL_ORDER.indexOf(a);
  const bIndex = LEVEL_ORDER.indexOf(b);

  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;

  return aIndex - bIndex;
}

function getSeasonYear(row: any) {
  return text(row.season_year || row.season || row.year);
}

function getSeasonTeam(row: any) {
  return displayTeamName(
    row.team_name ||
      row.team_name_zh ||
      row.team ||
      row.team_code ||
      row.teams?.name_zh ||
      row.teams?.name_en
  );
}

function getSeasonLevel(row: any) {
  return displayValue(row.level || row.player_level || row.stat_level);
}

function normalizeSeasonRow(row: any) {
  const h = toNumber(row.h);
  const doubles = toNumber(row.doubles ?? row.double ?? row.two_b);
  const triples = toNumber(row.triples ?? row.triple ?? row.three_b);
  const hr = toNumber(row.hr);
  const tb =
    row.tb !== null && row.tb !== undefined && row.tb !== ""
      ? toNumber(row.tb)
      : h - doubles - triples - hr + doubles * 2 + triples * 3 + hr * 4;

  const ipOuts =
    row.ip_outs !== null && row.ip_outs !== undefined && row.ip_outs !== ""
      ? toNumber(row.ip_outs)
      : ipToOuts(row.ip_display || row.ip);

  return {
    raw: row,

    year: getSeasonYear(row),
    team: getSeasonTeam(row),
    level: getSeasonLevel(row),

    games: toNumber(row.g),
    pa: toNumber(row.pa),
    ab: toNumber(row.ab),
    r: toNumber(row.r),
    h,
    tb,
    doubles,
    triples,
    hr,
    rbi: toNumber(row.rbi),
    bb: toNumber(row.bb),
    ibb: toNumber(row.ibb),
    hbp: toNumber(row.hbp),
    k: toNumber(row.k ?? row.so),
    sb: toNumber(row.sb),
    cs: toNumber(row.cs),
    sf: toNumber(row.sf),

    avg: row.official_avg ?? row.avg,
    obp: row.official_obp ?? row.obp,
    slg: row.official_slg ?? row.slg,
    ops: row.official_ops ?? row.ops,
    goAo: row.go_ao,
    kRate: row.official_k_rate ?? row.k_rate,
    bbRate: row.official_bb_rate ?? row.bb_rate,
    babip: row.official_babip ?? row.babip,

    win: toNumber(row.win ?? row.w),
    loss: toNumber(row.loss ?? row.l),
    era: row.official_era ?? row.era,
    gs: toNumber(row.gs),
    cg: toNumber(row.cg),
    sho: toNumber(row.sho),
    hold: toNumber(row.hold ?? row.hld),
    save: toNumber(row.save ?? row.sv),
    svo: toNumber(row.svo),
    ipOuts,
    ipDisplay: row.ip_display || row.ip,
    er: toNumber(row.er),
    pitchCount: toNumber(row.pitch_count ?? row.np),
    whip: row.official_whip ?? row.whip,
    avgAgainst: row.official_avg_against ?? row.avg_against ?? row.avg,
  };
}

function getTotal(rows: any[]) {
  return rows.reduce(
    (sum, row) => {
      sum.games += toNumber(row.games);
      sum.pa += toNumber(row.pa);
      sum.ab += toNumber(row.ab);
      sum.r += toNumber(row.r);
      sum.h += toNumber(row.h);
      sum.tb += toNumber(row.tb);
      sum.doubles += toNumber(row.doubles);
      sum.triples += toNumber(row.triples);
      sum.hr += toNumber(row.hr);
      sum.rbi += toNumber(row.rbi);
      sum.bb += toNumber(row.bb);
      sum.ibb += toNumber(row.ibb);
      sum.hbp += toNumber(row.hbp);
      sum.k += toNumber(row.k);
      sum.sb += toNumber(row.sb);
      sum.cs += toNumber(row.cs);
      sum.sf += toNumber(row.sf);

      sum.win += toNumber(row.win);
      sum.loss += toNumber(row.loss);
      sum.gs += toNumber(row.gs);
      sum.cg += toNumber(row.cg);
      sum.sho += toNumber(row.sho);
      sum.hold += toNumber(row.hold);
      sum.save += toNumber(row.save);
      sum.svo += toNumber(row.svo);
      sum.ipOuts += toNumber(row.ipOuts);
      sum.er += toNumber(row.er);
      sum.pitchCount += toNumber(row.pitchCount);

      return sum;
    },
    {
      games: 0,
      pa: 0,
      ab: 0,
      r: 0,
      h: 0,
      tb: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      rbi: 0,
      bb: 0,
      ibb: 0,
      hbp: 0,
      k: 0,
      sb: 0,
      cs: 0,
      sf: 0,

      win: 0,
      loss: 0,
      gs: 0,
      cg: 0,
      sho: 0,
      hold: 0,
      save: 0,
      svo: 0,
      ipOuts: 0,
      er: 0,
      pitchCount: 0,
    }
  );
}

function getHitterTotalRow(rows: any[], label = "合計") {
  const total = getTotal(rows);

  const avg = safeDivide(total.h, total.ab);
  const obp = safeDivide(
    total.h + total.bb + total.hbp,
    total.ab + total.bb + total.hbp + total.sf
  );
  const slg = safeDivide(total.tb, total.ab);
  const ops = obp !== null && slg !== null ? obp + slg : null;

  return {
    year: label,
    team: "-",
    level: "合計",
    ...total,
    avg,
    obp,
    slg,
    ops,
    goAo: "-",
    kRate: safeDivide(total.k, total.pa),
    bbRate: safeDivide(total.bb, total.pa),
    babip: safeDivide(total.h - total.hr, total.ab - total.k - total.hr + total.sf),
  };
}

function getPitcherTotalRow(rows: any[], label = "合計") {
  const total = getTotal(rows);
  const ip = total.ipOuts / 3;

  return {
    year: label,
    team: "-",
    level: "合計",
    ...total,
    era: safeDivide(total.er * 9, ip),
    ipDisplay: outsToIp(total.ipOuts),
    avgAgainst: "-",
    whip: safeDivide(total.bb + total.h, ip),
    goAo: "-",
    k9: safeDivide(total.k * 9, ip),
    bb9: safeDivide(total.bb * 9, ip),
    hr9: safeDivide(total.hr * 9, ip),
    h9: safeDivide(total.h * 9, ip),
    kbb: safeDivide(total.k, total.bb),
  };
}

function getEventContent(event: any) {
  return displayValue(
    event.note || event.to_team || event.to_level || event.status || event.event_type
  );
}

export default function PlayerStatsTabs({
  player,
  playerReports,
  playerEvents,
  scoutingReports,
  currentSeasonStats = [],
  seasonStats = [],
}: PlayerStatsTabsProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "current";
  const gameDate = searchParams.get("date") || "";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedYears, setExpandedYears] = useState<string[]>([
    String(new Date().getFullYear()),
  ]);
  const [levelFilter, setLevelFilter] = useState("全部");
  const [yearFilter, setYearFilter] = useState("全部");

  const pitcher = isPitcher(player);
  const currentYear = String(new Date().getFullYear());

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function toggleYear(year: string) {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((v) => v !== year) : [...prev, year]
    );
  }

  const allRows = useMemo(() => {
    const source = activeTab === "current" ? currentSeasonStats : seasonStats;

    return source
      .map(normalizeSeasonRow)
      .filter((row) => {
        if (levelFilter !== "全部") return row.level === levelFilter;
        return true;
      })
      .sort((a, b) => {
        const yearDiff = Number(b.year) - Number(a.year);
        if (yearDiff !== 0) return yearDiff;

        const levelDiff = sortLevel(String(a.level), String(b.level));
        if (levelDiff !== 0) return levelDiff;

        return String(a.team).localeCompare(String(b.team));
      });
  }, [activeTab, currentSeasonStats, seasonStats, levelFilter]);

  const levelOptions = useMemo(() => {
    const source = activeTab === "current" ? currentSeasonStats : seasonStats;

    const levels = Array.from(
      new Set(source.map((row) => getSeasonLevel(row)).filter((v) => v && v !== "-"))
    );

    return ["全部", ...levels.sort(sortLevel)];
  }, [activeTab, currentSeasonStats, seasonStats]);

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(allRows.map((row) => String(row.year)).filter(Boolean))
    );

    return ["全部", ...years.sort((a, b) => Number(b) - Number(a))];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    if (yearFilter === "全部") return allRows;
    return allRows.filter((row) => String(row.year) === yearFilter);
  }, [allRows, yearFilter]);

  const currentRows = useMemo(() => {
    return allRows.filter((row) => String(row.year) === currentYear);
  }, [allRows, currentYear]);

  const historyRows = filteredRows;

  const groupedHistoryRows = useMemo(() => {
    const groups: Record<string, any[]> = {};

    for (const row of historyRows) {
      const year = String(row.year || "未知年份");
      if (!groups[year]) groups[year] = [];
      groups[year].push(row);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, rows]) => ({
        year,
        rows,
        total: pitcher ? getPitcherTotalRow(rows, year) : getHitterTotalRow(rows, year),
      }));
  }, [historyRows, pitcher]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
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
          <option value="scouting">球探評分</option>
        </select>
      </div>

      <div className="hidden border-b border-slate-800 text-sm md:grid md:grid-cols-5">
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
        <TabButton active={activeTab === "scouting"} onClick={() => setActiveTab("scouting")}>
          球探評分
        </TabButton>
      </div>

      <div className="p-5">
        {activeTab === "current" || activeTab === "history" ? (
          <div className="mb-4 flex flex-wrap gap-3">
            {activeTab === "history" ? (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : null}

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            >
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          {activeTab === "current" ? (
            pitcher ? (
              <PitcherTable rows={currentRows} totalRow={getPitcherTotalRow(currentRows)} />
            ) : (
              <HitterTable rows={currentRows} totalRow={getHitterTotalRow(currentRows)} />
            )
          ) : null}

          {activeTab === "history" ? (
            pitcher ? (
              <PitcherHistoryTable
                groups={groupedHistoryRows}
                expandedYears={expandedYears}
                toggleYear={toggleYear}
                allTotalRow={getPitcherTotalRow(historyRows)}
              />
            ) : (
              <HitterHistoryTable
                groups={groupedHistoryRows}
                expandedYears={expandedYears}
                toggleYear={toggleYear}
                allTotalRow={getHitterTotalRow(historyRows)}
              />
            )
          ) : null}

          {activeTab === "games" ? (
            <GameList reports={playerReports} dateFilter={gameDate} />
          ) : null}

          {activeTab === "events" ? <EventList events={playerEvents} /> : null}

          {activeTab === "scouting" ? (
            <PlayerScoutingReports reports={scoutingReports} />
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
      className={`w-full whitespace-nowrap px-5 py-3 text-center ${
        active ? "bg-slate-800 font-bold text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

const HITTER_HEADERS = [
  "Season",
  "Team",
  "Level",
  "G",
  "PA",
  "AB",
  "R",
  "H",
  "TB",
  "2B",
  "3B",
  "HR",
  "RBI",
  "BB",
  "IBB",
  "HBP",
  "SO",
  "SB",
  "CS",
  "SF",
  "AVG",
  "OBP",
  "SLG",
  "OPS",
  "GO/AO",
  "K%",
  "BB%",
  "BABIP",
];

const PITCHER_HEADERS = [
  "Season",
  "Team",
  "Level",
  "W",
  "L",
  "ERA",
  "G",
  "GS",
  "CG",
  "SHO",
  "HLD",
  "SV",
  "SVO",
  "IP",
  "H",
  "R",
  "ER",
  "HR",
  "NP",
  "HBP",
  "BB",
  "IBB",
  "SO",
  "AVG",
  "WHIP",
  "GO/AO",
  "K/9",
  "BB/9",
  "HR/9",
  "H/9",
  "K/BB",
];

function HitterTable({ rows, totalRow }: { rows: any[]; totalRow: any }) {
  return (
    <table className="w-full min-w-[1700px] text-sm">
      <TableHead headers={HITTER_HEADERS} />
      <tbody>
        {rows.map((row, index) => (
          <HitterRow key={`${row.year}-${row.team}-${row.level}-${index}`} row={row} />
        ))}
        <HitterRow row={totalRow} bold />
      </tbody>
    </table>
  );
}

function HitterHistoryTable({
  groups,
  expandedYears,
  toggleYear,
  allTotalRow,
}: {
  groups: any[];
  expandedYears: string[];
  toggleYear: (year: string) => void;
  allTotalRow: any;
}) {
  return (
    <table className="w-full min-w-[1700px] text-sm">
      <TableHead headers={HITTER_HEADERS} />
      <tbody>
        {groups.map((group) => {
          const expanded = expandedYears.includes(group.year);

          return (
            <React.Fragment key={group.year}>
              <HitterRow
                row={group.total}
                bold
                clickable
                prefix={expanded ? "▼" : "▶"}
                onClick={() => toggleYear(group.year)}
              />

              {expanded
                ? group.rows.map((row: any, index: number) => (
                    <HitterRow
                      key={`${row.year}-${row.team}-${row.level}-${index}`}
                      row={row}
                      indent
                    />
                  ))
                : null}
            </React.Fragment>
          );
        })}

        <HitterRow row={{ ...allTotalRow, year: "生涯" }} bold />
      </tbody>
    </table>
  );
}

function HitterRow({
  row,
  bold = false,
  clickable = false,
  prefix = "",
  indent = false,
  onClick,
}: {
  row: any;
  bold?: boolean;
  clickable?: boolean;
  prefix?: string;
  indent?: boolean;
  onClick?: () => void;
}) {
  const className = [
    "border-t border-slate-800",
    bold ? "bg-slate-800/50 font-bold" : "",
    clickable ? "cursor-pointer hover:bg-slate-800" : "",
  ].join(" ");

  const stickyBg = bold ? "bg-slate-800" : "bg-slate-900";

  return (
    <tr className={className} onClick={onClick}>
      <td className={`sticky left-0 z-20 w-[90px] min-w-[90px] ${stickyBg} p-3 ${indent ? "pl-8" : ""}`}>
        {prefix ? `${prefix} ` : ""}
        {row.year}
      </td>
      <td className={`sticky left-[90px] z-20 w-[120px] min-w-[120px] ${stickyBg} p-3`}>
        {displayTeamName(row.team)}
      </td>
      <td className={`sticky left-[210px] z-20 w-[90px] min-w-[90px] ${stickyBg} p-3`}>
        {displayValue(row.level)}
      </td>
      <td className="p-3">{row.games}</td>
      <td className="p-3">{row.pa}</td>
      <td className="p-3">{row.ab}</td>
      <td className="p-3">{row.r}</td>
      <td className="p-3">{row.h}</td>
      <td className="p-3">{row.tb}</td>
      <td className="p-3">{row.doubles}</td>
      <td className="p-3">{row.triples}</td>
      <td className="p-3">{row.hr}</td>
      <td className="p-3">{row.rbi}</td>
      <td className="p-3">{row.bb}</td>
      <td className="p-3">{row.ibb}</td>
      <td className="p-3">{row.hbp}</td>
      <td className="p-3">{row.k}</td>
      <td className="p-3">{row.sb}</td>
      <td className="p-3">{row.cs}</td>
      <td className="p-3">{row.sf}</td>
      <td className="p-3">{formatRate(row.avg)}</td>
      <td className="p-3">{formatRate(row.obp)}</td>
      <td className="p-3">{formatRate(row.slg)}</td>
      <td className="p-3">{formatRate(row.ops)}</td>
      <td className="p-3">{displayValue(row.goAo)}</td>
      <td className="p-3">{formatPercent(row.kRate)}</td>
      <td className="p-3">{formatPercent(row.bbRate)}</td>
      <td className="p-3">{formatRate(row.babip)}</td>
    </tr>
  );
}

function PitcherTable({ rows, totalRow }: { rows: any[]; totalRow: any }) {
  return (
    <table className="w-full min-w-[1850px] text-sm">
      <TableHead headers={PITCHER_HEADERS} />
      <tbody>
        {rows.map((row, index) => (
          <PitcherRow key={`${row.year}-${row.team}-${row.level}-${index}`} row={row} />
        ))}
        <PitcherRow row={totalRow} bold />
      </tbody>
    </table>
  );
}

function PitcherHistoryTable({
  groups,
  expandedYears,
  toggleYear,
  allTotalRow,
}: {
  groups: any[];
  expandedYears: string[];
  toggleYear: (year: string) => void;
  allTotalRow: any;
}) {
  return (
    <table className="w-full min-w-[1850px] text-sm">
      <TableHead headers={PITCHER_HEADERS} />
      <tbody>
        {groups.map((group) => {
          const expanded = expandedYears.includes(group.year);

          return (
            <React.Fragment key={group.year}>
              <PitcherRow
                row={group.total}
                bold
                clickable
                prefix={expanded ? "▼" : "▶"}
                onClick={() => toggleYear(group.year)}
              />

              {expanded
                ? group.rows.map((row: any, index: number) => (
                    <PitcherRow
                      key={`${row.year}-${row.team}-${row.level}-${index}`}
                      row={row}
                      indent
                    />
                  ))
                : null}
            </React.Fragment>
          );
        })}

        <PitcherRow row={{ ...allTotalRow, year: "生涯" }} bold />
      </tbody>
    </table>
  );
}

function PitcherRow({
  row,
  bold = false,
  clickable = false,
  prefix = "",
  indent = false,
  onClick,
}: {
  row: any;
  bold?: boolean;
  clickable?: boolean;
  prefix?: string;
  indent?: boolean;
  onClick?: () => void;
}) {
  const ip = toNumber(row.ipOuts) / 3;
  const k9 = row.k9 ?? safeDivide(row.k * 9, ip);
  const bb9 = row.bb9 ?? safeDivide(row.bb * 9, ip);
  const hr9 = row.hr9 ?? safeDivide(row.hr * 9, ip);
  const h9 = row.h9 ?? safeDivide(row.h * 9, ip);
  const kbb = row.kbb ?? safeDivide(row.k, row.bb);

  const className = [
    "border-t border-slate-800",
    bold ? "bg-slate-800/50 font-bold" : "",
    clickable ? "cursor-pointer hover:bg-slate-800" : "",
  ].join(" ");

  const stickyBg = bold ? "bg-slate-800" : "bg-slate-900";

  return (
    <tr className={className} onClick={onClick}>
      <td className={`sticky left-0 z-20 w-[90px] min-w-[90px] ${stickyBg} p-3 ${indent ? "pl-8" : ""}`}>
        {prefix ? `${prefix} ` : ""}
        {row.year}
      </td>
      <td className={`sticky left-[90px] z-20 w-[120px] min-w-[120px] ${stickyBg} p-3`}>
        {displayTeamName(row.team)}
      </td>
      <td className={`sticky left-[210px] z-20 w-[90px] min-w-[90px] ${stickyBg} p-3`}>
        {displayValue(row.level)}
      </td>
      <td className="p-3">{row.win}</td>
      <td className="p-3">{row.loss}</td>
      <td className="p-3">{formatDecimal(row.era)}</td>
      <td className="p-3">{row.games}</td>
      <td className="p-3">{row.gs}</td>
      <td className="p-3">{row.cg}</td>
      <td className="p-3">{row.sho}</td>
      <td className="p-3">{row.hold}</td>
      <td className="p-3">{row.save}</td>
      <td className="p-3">{row.svo}</td>
      <td className="p-3">{row.ipDisplay || outsToIp(row.ipOuts)}</td>
      <td className="p-3">{row.h}</td>
      <td className="p-3">{row.r}</td>
      <td className="p-3">{row.er}</td>
      <td className="p-3">{row.hr}</td>
      <td className="p-3">{row.pitchCount}</td>
      <td className="p-3">{row.hbp}</td>
      <td className="p-3">{row.bb}</td>
      <td className="p-3">{row.ibb}</td>
      <td className="p-3">{row.k}</td>
      <td className="p-3">{displayValue(row.avgAgainst)}</td>
      <td className="p-3">{formatDecimal(row.whip)}</td>
      <td className="p-3">{displayValue(row.goAo)}</td>
      <td className="p-3">{formatDecimal(k9)}</td>
      <td className="p-3">{formatDecimal(bb9)}</td>
      <td className="p-3">{formatDecimal(hr9)}</td>
      <td className="p-3">{formatDecimal(h9)}</td>
      <td className="p-3">{formatDecimal(kbb)}</td>
    </tr>
  );
}

function TableHead({ headers }: { headers: string[] }) {
  return (
    <thead className="bg-slate-800 text-slate-300">
      <tr>
        {headers.map((h) => {
          const stickyClass =
            h === "Season"
              ? "sticky left-0 z-30 w-[90px] min-w-[90px] bg-slate-800"
              : h === "Team"
              ? "sticky left-[90px] z-30 w-[120px] min-w-[120px] bg-slate-800"
              : h === "Level"
              ? "sticky left-[210px] z-30 w-[90px] min-w-[90px] bg-slate-800"
              : "";

          return (
            <th key={h} className={`whitespace-nowrap p-3 text-left ${stickyClass}`}>
              {h}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function GameList({
  reports,
  dateFilter,
}: {
  reports: any[];
  dateFilter?: string;
}) {
  const visibleReports = dateFilter
    ? reports.filter(
        (report) => String(report.report_date || "").slice(0, 10) === dateFilter
      )
    : reports;

  if (!visibleReports.length) {
    return <div className="p-5 text-slate-400">目前沒有出賽紀錄</div>;
  }

  const reportsAsc = [...visibleReports].sort((a, b) => {
    return String(a.report_date || "").localeCompare(String(b.report_date || ""));
  });

  const sortedReports = [...visibleReports].sort((a, b) => {
    return String(b.report_date || "").localeCompare(String(a.report_date || ""));
  });

  function getTotalsUntil(targetReport: any) {
    const targetDate = String(targetReport.report_date || "").slice(0, 10);
    const targetYear = targetDate.slice(0, 4);

    return reportsAsc.reduce(
      (totals, report) => {
        const reportDate = String(report.report_date || "").slice(0, 10);
        const reportYear = reportDate.slice(0, 4);

        if (reportYear !== targetYear) return totals;
        if (reportDate > targetDate) return totals;

        totals.outs += ipToOuts(report.ip);
        totals.er += toNumber(report.er);
        totals.h += toNumber(report.h);
        totals.bb += toNumber(report.bb);

        return totals;
      },
      { outs: 0, er: 0, h: 0, bb: 0 }
    );
  }

  function formatIp(value: unknown) {
    const raw = text(value);
    if (!raw) return "0.0";
    if (!raw.includes(".")) return `${raw}.0`;
    return raw;
  }

  function getPitchingStats(report: any) {
    const totals = getTotalsUntil(report);
    const ip = totals.outs / 3;

    return {
      ip: formatIp(report.ip),
      h: toNumber(report.h),
      hr: toNumber(report.hr),
      k: toNumber(report.k),
      bb: toNumber(report.bb),
      pitchCount: toNumber(report.pitch_count),
      era: formatDecimal(safeDivide(totals.er * 9, ip)),
      whip: formatDecimal(safeDivide(totals.h + totals.bb, ip)),
    };
  }

  return (
    <table className="w-full min-w-[1050px] text-sm">
      <thead className="bg-slate-800 text-slate-300">
        <tr>
          {[
            "日期",
            "賽事",
            "球隊",
            "層級",
            "對手",
            "局數",
            "投球數",
            "被安打",
            "全壘打",
            "三振",
            "四壞",
            "ERA",
            "WHIP",
          ].map((h) => (
            <th key={h} className="whitespace-nowrap p-3 text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {sortedReports.map((report) => {
          const isPitch = text(report.ip) || text(report.pitch_count) || text(report.er);
          if (!isPitch) return null;

          const s = getPitchingStats(report);

          return (
            <tr
              key={report.id || `${report.report_date}-${report.result}`}
              className="border-t border-slate-800"
            >
              <td className="p-3">{displayValue(report.report_date)}</td>
              <td className="p-3">{displayGameType(report.game_type)}</td>
              <td className="p-3">
                {displayValue(
                  report.team_name ||
                    report.team ||
                    report.players?.team_name ||
                    report.players?.teams?.name_zh ||
                    report.players?.teams?.name_en
                )}
              </td>
              <td className="p-3">
                {displayValue(
                  normalizeLevel(
                    report.level || report.player_level || report.players?.level,
                    report.league || report.players?.league
                  )
                )}
              </td>
              <td className="p-3">{displayValue(report.opponent)}</td>
              <td className="p-3">{s.ip}</td>
              <td className="p-3">{s.pitchCount}</td>
              <td className="p-3">{s.h}</td>
              <td className="p-3">{s.hr}</td>
              <td className="p-3">{s.k}</td>
              <td className="p-3">{s.bb}</td>
              <td className="p-3">{s.era}</td>
              <td className="p-3">{s.whip}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function EventList({ events }: { events: any[] }) {
  if (!events.length) {
    return <div className="p-5 text-slate-400">目前沒有狀態紀錄</div>;
  }

  const eventsByYear = events.reduce((acc: Record<string, any[]>, event: any) => {
    const year = String(event.event_date || "").slice(0, 4) || "未知年份";
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {});

  return (
    <div className="divide-y divide-slate-800">
      {Object.entries(eventsByYear)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, yearEvents]) => (
          <details key={year} open={year === String(new Date().getFullYear())}>
            <summary className="cursor-pointer select-none bg-slate-800/70 px-4 py-3 font-bold text-sky-300 hover:bg-slate-800">
              {year}
            </summary>

            {yearEvents.map((event: any) => (
              <div
                key={event.id || `${event.event_date}-${event.event_type}`}
                className="grid grid-cols-[120px_1fr] gap-4 border-t border-slate-800 p-4"
              >
                <div className="text-sm text-slate-400">
                  {displayValue(event.event_date)}
                </div>

                <div className="font-bold text-white">{getEventContent(event)}</div>
              </div>
            ))}
          </details>
        ))}
    </div>
  );
}