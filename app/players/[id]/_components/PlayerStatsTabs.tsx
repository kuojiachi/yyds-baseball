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

function isMissing(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function toNumber(value: unknown) {
  if (isMissing(value)) return null;

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function toNumberOrZero(value: unknown) {
  const n = toNumber(value);
  return n ?? 0;
}

function displayValue(value: unknown) {
  if (isMissing(value)) return "-";
  return String(value);
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

function safeDivide(top: unknown, bottom: unknown) {
  const nTop = toNumber(top);
  const nBottom = toNumber(bottom);

  if (nTop === null || nBottom === null || nBottom === 0) return null;

  return nTop / nBottom;
}

function parseRateNumber(value: unknown) {
  const raw = text(value).replace("%", "");
  if (!raw || raw === "-" || raw === ".---") return null;

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;

  return n;
}

function roundToInteger(value: unknown) {
  const n = toNumber(value);
  if (n === null) return null;

  return Math.round(n);
}

function inferSacFlies(params: {
  h: number | null;
  bb: number | null;
  hbp: number | null;
  ab: number | null;
  obp: unknown;
}) {
  const obp = parseRateNumber(params.obp);

  if (
    obp === null ||
    obp <= 0 ||
    params.h === null ||
    params.bb === null ||
    params.hbp === null ||
    params.ab === null
  ) {
    return null;
  }

  const numerator = params.h + params.bb + params.hbp;
  const denominatorWithoutSf = params.ab + params.bb + params.hbp;
  const inferred = numerator / obp - denominatorWithoutSf;

  if (!Number.isFinite(inferred) || inferred < -0.35) return null;

  const rounded = Math.round(inferred);

  return rounded >= 0 ? rounded : 0;
}

function formatRate(value: unknown) {
  if (isMissing(value)) return "-";

  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  return n.toFixed(3).replace(/^0/, "");
}

function formatDecimal(value: unknown) {
  if (isMissing(value)) return "-";

  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  return n.toFixed(2);
}

function formatPercent(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  const percent = Math.abs(n) <= 1 ? n * 100 : n;

  return `${percent.toFixed(1)}%`;
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

function ipToOutsNullable(ipValue: unknown) {
  if (isMissing(ipValue)) return null;
  return ipToOuts(ipValue);
}

function outsToIp(outs: unknown) {
  const n = toNumber(outs);
  if (n === null) return "-";

  const whole = Math.floor(n / 3);
  const rest = n % 3;
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
  const ab = toNumber(row.ab);
  const bb = toNumber(row.bb);
  const hbp = toNumber(row.hbp);
  const k = toNumber(row.k ?? row.so);
  const pa = toNumber(row.pa);
  const officialObp = row.official_obp ?? row.obp;
  const officialSlg = row.official_slg ?? row.slg;

  const inferredSf = inferSacFlies({
    h,
    bb,
    hbp,
    ab,
    obp: officialObp,
  });

  const tb = !isMissing(row.tb)
    ? toNumber(row.tb)
    : h !== null && doubles !== null && triples !== null && hr !== null
    ? h + doubles + triples * 2 + hr * 3
    : ab !== null && parseRateNumber(officialSlg) !== null
    ? roundToInteger((parseRateNumber(officialSlg) ?? 0) * ab)
    : null;

  const sf = !isMissing(row.sf) ? toNumber(row.sf) : inferredSf;
  const calculatedAvg = safeDivide(h, ab);
  const calculatedObp =
    h !== null && bb !== null && hbp !== null && ab !== null && sf !== null
      ? safeDivide(h + bb + hbp, ab + bb + hbp + sf)
      : null;
  const calculatedSlg = tb !== null && ab !== null ? safeDivide(tb, ab) : null;
  const calculatedOps =
    calculatedObp !== null && calculatedSlg !== null
      ? calculatedObp + calculatedSlg
      : null;
  const calculatedBabip =
    h !== null && hr !== null && ab !== null && k !== null && sf !== null
      ? safeDivide(h - hr, ab - k - hr + sf)
      : null;

  const ipOuts = !isMissing(row.ip_outs)
    ? toNumber(row.ip_outs)
    : ipToOutsNullable(row.ip_display || row.ip);

  const pitcherIp = ipOuts !== null ? ipOuts / 3 : null;
  const pitcherH = toNumber(row.h);
  const pitcherBb = toNumber(row.bb);
  const pitcherEr = toNumber(row.er);

  return {
    raw: row,

    year: getSeasonYear(row),
    team: getSeasonTeam(row),
    level: getSeasonLevel(row),

    games: toNumber(row.g),
    pa: toNumber(row.pa),
    ab,
    r: toNumber(row.r),
    h,
    tb,
    doubles,
    triples,
    hr,
    rbi: toNumber(row.rbi),
    bb,
    ibb: toNumber(row.ibb),
    hbp,
    k,
    sb: toNumber(row.sb),
    cs: toNumber(row.cs),
    sf,

    avg: row.official_avg ?? row.avg ?? calculatedAvg,
    obp: officialObp ?? calculatedObp,
    slg: officialSlg ?? calculatedSlg,
    ops: row.official_ops ?? row.ops ?? calculatedOps,
    goAo: row.go_ao,
    kRate: row.official_k_rate ?? row.k_rate ?? (k !== null && pa !== null ? safeDivide(k * 100, pa) : null),
    bbRate: row.official_bb_rate ?? row.bb_rate ?? (bb !== null && pa !== null ? safeDivide(bb * 100, pa) : null),
    babip: row.official_babip ?? row.babip ?? calculatedBabip,

    win: toNumber(row.win ?? row.w),
    loss: toNumber(row.loss ?? row.l),
    era:
      row.official_era ??
      row.era ??
      (pitcherIp !== null && pitcherEr !== null
        ? safeDivide(pitcherEr * 9, pitcherIp)
        : null),
    gs: toNumber(row.gs),
    cg: toNumber(row.cg),
    sho: toNumber(row.sho),
    hold: toNumber(row.hold ?? row.hld),
    save: toNumber(row.save ?? row.sv),
    svo: toNumber(row.svo),
    ipOuts,
    ipDisplay: row.ip_display || row.ip,
    bf: toNumber(row.bf ?? row.batters_faced ?? row.battersFaced),
    runsAllowed: toNumber(row.r),
    er: toNumber(row.er),
    pitchCount: toNumber(row.pitch_count ?? row.np),
    whip:
      row.official_whip ??
      row.whip ??
      (pitcherIp !== null && pitcherH !== null && pitcherBb !== null
        ? safeDivide(pitcherH + pitcherBb, pitcherIp)
        : null),
    avgAgainst: row.official_avg_against ?? row.avg_against ?? row.avg,
  };
}

function getTotal(rows: any[]) {
  const keys = [
    "games", "pa", "ab", "r", "h", "tb", "doubles", "triples", "hr",
    "rbi", "bb", "ibb", "hbp", "k", "sb", "cs", "sf", "win", "loss",
    "gs", "cg", "sho", "hold", "save", "svo", "ipOuts", "bf", "runsAllowed",
    "er", "pitchCount",
  ];

  const total: Record<string, number | null> = {};

  for (const key of keys) {
    if (!rows.length) {
      total[key] = null;
      continue;
    }

    let sum = 0;
    let complete = true;

    for (const row of rows) {
      const value = toNumber(row[key]);

      if (value === null) {
        complete = false;
        break;
      }

      sum += value;
    }

    total[key] = complete ? sum : null;
  }

  return total;
}

function getHitterTotalRow(rows: any[], label = "合計") {
  const total = getTotal(rows);

  const hasAll = (key: string) =>
    rows.every(
      (row) =>
        row[key] !== null &&
        row[key] !== undefined &&
        row[key] !== "-"
    );

  const h = toNumber(total.h);
  const ab = toNumber(total.ab);
  const bb = toNumber(total.bb);
  const hbp = toNumber(total.hbp);
  const sf = toNumber(total.sf);
  const tb = toNumber(total.tb);
  const hr = toNumber(total.hr);
  const k = toNumber(total.k);
  const pa = toNumber(total.pa);

  const avg = hasAll("h") && hasAll("ab")
    ? safeDivide(h, ab)
    : null;

  const obp = hasAll("h") && hasAll("bb") && hasAll("hbp") && hasAll("ab") && hasAll("sf")
    ? safeDivide(
        (h ?? 0) + (bb ?? 0) + (hbp ?? 0),
        (ab ?? 0) + (bb ?? 0) + (hbp ?? 0) + (sf ?? 0)
      )
    : null;

  const slg = hasAll("tb") && hasAll("ab")
    ? safeDivide(tb, ab)
    : null;

  const ops = obp !== null && slg !== null ? obp + slg : null;

  const babip = hasAll("h") && hasAll("hr") && hasAll("ab") && hasAll("k") && hasAll("sf")
    ? safeDivide(
        (h ?? 0) - (hr ?? 0),
        (ab ?? 0) - (k ?? 0) - (hr ?? 0) + (sf ?? 0)
      )
    : null;
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

    kRate:
      hasAll("k") && hasAll("pa")
        ? safeDivide((k ?? 0) * 100, pa)
        : null,

    bbRate:
      hasAll("bb") && hasAll("pa")
        ? safeDivide((bb ?? 0) * 100, pa)
        : null,

    babip,
  };
}

function getPitcherTotalRow(rows: any[], label = "合計") {
  const total = getTotal(rows);

  const ipOuts = toNumber(total.ipOuts);
  const ip = ipOuts !== null ? ipOuts / 3 : null;

  const er = toNumber(total.er);
  const bb = toNumber(total.bb);
  const h = toNumber(total.h);
  const k = toNumber(total.k);
  const hr = toNumber(total.hr);
  const hbp = toNumber(total.hbp);
  const bf = toNumber(total.bf);

  return {
    year: label,
    team: "-",
    level: "合計",
    ...total,

    era:
      ip !== null && er !== null
        ? safeDivide(er * 9, ip)
        : null,

    ipDisplay:
      ipOuts !== null
        ? outsToIp(ipOuts)
        : "-",

    whip:
      ip !== null && bb !== null && h !== null
        ? safeDivide(bb + h, ip)
        : null,

    k9:
      ip !== null && k !== null
        ? safeDivide(k * 9, ip)
        : null,

    bb9:
      ip !== null && bb !== null
        ? safeDivide(bb * 9, ip)
        : null,

    hr9:
      ip !== null && hr !== null
        ? safeDivide(hr * 9, ip)
        : null,

    h9:
      ip !== null && h !== null
        ? safeDivide(h * 9, ip)
        : null,

    kbb:
      k !== null && bb !== null
        ? safeDivide(k, bb)
        : null,

    kRate:
      k !== null && bf !== null
        ? safeDivide(k, bf)
        : null,

    bbRate:
      bb !== null && bf !== null
        ? safeDivide(bb, bf)
        : null,

    hrRate:
      hr !== null && bf !== null
        ? safeDivide(hr, bf)
        : null,

    hbpRate:
      hbp !== null && bf !== null
        ? safeDivide(hbp, bf)
        : null,

    obpAgainst:
      h !== null && bb !== null && hbp !== null && bf !== null
        ? safeDivide(h + bb + hbp, bf)
        : null,
  };
}

function sumReportValues(rows: any[], getter: (row: any) => unknown) {
  if (!rows.length) return null;

  let sum = 0;

  for (const row of rows) {
    const value = toNumber(getter(row));

    if (value === null) return null;

    sum += value;
  }

  return sum;
}

function reportIpToOuts(row: any) {
  const explicitOuts = toNumber(row.ip_outs);

  if (explicitOuts !== null) return explicitOuts;

  return ipToOutsNullable(row.ip);
}

function sumReportIpOuts(rows: any[]) {
  if (!rows.length) return null;

  let sum = 0;

  for (const row of rows) {
    const outs = reportIpToOuts(row);

    if (outs === null) return null;

    sum += outs;
  }

  return sum;
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

  const hasPitchingStats = allRows.some(
    (row) => row.raw?.stat_type === "pitching"
  );

  const hasBattingStats = allRows.some(
    (row) => row.raw?.stat_type === "batting"
  );

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

      if (!groups[year]) {
        groups[year] = [];
      }

      groups[year].push(row);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, rows]) => {
        const hasPitchingRows = rows.some(
          (row) => row.raw?.stat_type === "pitching"
        );

        return {
          year,
          rows,
          total: hasPitchingRows
            ? getPitcherTotalRow(rows, year)
            : getHitterTotalRow(rows, year),
        };
      });
  }, [historyRows]);
      
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

        <div>
          {activeTab === "history" ? (
            <>
              {hasBattingStats ? (
                <HitterHistoryTable
                  groups={groupedHistoryRows.filter((group) =>
                    group.rows.some(
                      (row: any) => row.raw?.stat_type === "batting"
                    )
                  )}
                  expandedYears={expandedYears}
                  toggleYear={toggleYear}
                  allTotalRow={getHitterTotalRow(
                    historyRows.filter(
                      (row) => row.raw?.stat_type === "batting"
                    ),
                    "生涯"
                  )}
                />
              ) : null}

              {hasPitchingStats ? (
                <PitcherHistoryTable
                  groups={groupedHistoryRows.filter((group) =>
                    group.rows.some(
                      (row: any) => row.raw?.stat_type === "pitching"
                    )
                  )}
                  expandedYears={expandedYears}
                  toggleYear={toggleYear}
                  allTotalRow={getPitcherTotalRow(
                    historyRows.filter(
                      (row) => row.raw?.stat_type === "pitching"
                    ),
                    "生涯"
                  )}
                />
              ) : null}
            </>
          ) : null}

          {activeTab === "current" ? (
            <>
              {hasBattingStats ? (
                <HitterTable
                  rows={currentRows.filter(
                    (row) => row.raw?.stat_type === "batting"
                  )}
                  totalRow={getHitterTotalRow(
                    currentRows.filter(
                      (row) => row.raw?.stat_type === "batting"
                    ),
                    currentYear
                  )}
                />
              ) : null}

              {hasPitchingStats ? (
                <PitcherTable
                  rows={currentRows.filter(
                    (row) => row.raw?.stat_type === "pitching"
                  )}
                  totalRow={getPitcherTotalRow(
                    currentRows.filter(
                      (row) => row.raw?.stat_type === "pitching"
                    ),
                    currentYear
                  )}
                />
              ) : null}
            </>
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
  "年份", "球隊", "層級", "出賽", "打席", "打數", "得分", "安打", "壘打數",
  "二壘打", "三壘打", "全壘打", "打點", "保送", "故意四壞", "觸身球",
  "三振", "盜壘", "盜壘失敗", "高飛犧牲打", "打擊率", "上壘率",
  "長打率", "整體攻擊指數", "滾飛比", "三振率", "保送率", "場內安打率",
];

const PITCHER_HEADERS = [
  "年份", "球隊", "層級", "勝", "敗", "防禦率", "出賽", "先發", "完投",
  "完封", "中繼成功", "救援成功", "救援機會", "投球局數", "打者", "被安打",
  "失分", "責失", "被全壘打", "球數", "觸身球", "保送", "故意四壞",
  "三振", "被打擊率", "每局被上壘率", "對手上壘率", "滾飛比", "K/9", "BB/9",
  "HR/9", "H/9", "K/BB", "K%", "BB%", "HR%", "HBP%",
];

function HitterTable({ rows, totalRow }: { rows: any[]; totalRow: any }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-[1700px] whitespace-nowrap text-sm">
        <TableHead headers={HITTER_HEADERS} />
        <tbody>
          {rows.map((row, index) => (
            <HitterRow key={`${row.year}-${row.team}-${row.level}-${index}`} row={row} />
          ))}
          <HitterRow row={totalRow} bold />
        </tbody>
      </table>
    </div>
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
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-[1700px] whitespace-nowrap text-sm">
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
     </div>
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
      <td className="p-3">{displayValue(row.games)}</td>
      <td className="p-3">{displayValue(row.pa)}</td>
      <td className="p-3">{displayValue(row.ab)}</td>
      <td className="p-3">{displayValue(row.r)}</td>
      <td className="p-3">{displayValue(row.h)}</td>
      <td className="p-3">{displayValue(row.tb)}</td>
      <td className="p-3">{displayValue(row.doubles)}</td>
      <td className="p-3">{displayValue(row.triples)}</td>
      <td className="p-3">{displayValue(row.hr)}</td>
      <td className="p-3">{displayValue(row.rbi)}</td>
      <td className="p-3">{displayValue(row.bb)}</td>
      <td className="p-3">{displayValue(row.ibb)}</td>
      <td className="p-3">{displayValue(row.hbp)}</td>
      <td className="p-3">{displayValue(row.k)}</td>
      <td className="p-3">{displayValue(row.sb)}</td>
      <td className="p-3">{displayValue(row.cs)}</td>
      <td className="p-3">{displayValue(row.sf)}</td>
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
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-[2100px] text-sm">
        <TableHead headers={PITCHER_HEADERS} />
        <tbody>
          {rows.map((row, index) => (
            <PitcherRow key={`${row.year}-${row.team}-${row.level}-${index}`} row={row} />
          ))}
          <PitcherRow row={totalRow} bold />
        </tbody>
      </table>
    </div>
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
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-[2100px] text-sm">
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
    </div>
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
  const ipOuts = toNumber(row.ipOuts);
  const ip = ipOuts !== null ? ipOuts / 3 : null;

  const bf = toNumber(row.bf);
  const h = toNumber(row.h);
  const bb = toNumber(row.bb);
  const hbp = toNumber(row.hbp);
  const hr = toNumber(row.hr);
  const k = toNumber(row.k);

  const k9 = row.k9 ?? safeDivide(k !== null ? k * 9 : null, ip);

  const bb9 = row.bb9 ?? safeDivide(bb !== null ? bb * 9 : null, ip);
  const hr9 = row.hr9 ?? safeDivide(hr !== null ? hr * 9 : null, ip);
  const h9 = row.h9 ?? safeDivide(h !== null ? h * 9 : null, ip);
  const kbb = row.kbb ?? safeDivide(k, bb);
  const kRate = row.kRate ?? safeDivide(k, bf);
  const bbRate = row.bbRate ?? safeDivide(bb, bf);
  const hrRate = row.hrRate ?? safeDivide(hr, bf);
  const hbpRate = row.hbpRate ?? safeDivide(hbp, bf);
  const obpAgainst = row.obpAgainst ?? safeDivide(
    h !== null && bb !== null && hbp !== null ? h + bb + hbp : null,
    bf
  );

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
      <td className="p-3">{displayValue(row.win)}</td>
      <td className="p-3">{displayValue(row.loss)}</td>
      <td className="p-3">{formatDecimal(row.era)}</td>
      <td className="p-3">{displayValue(row.games)}</td>
      <td className="p-3">{displayValue(row.gs)}</td>
      <td className="p-3">{displayValue(row.cg)}</td>
      <td className="p-3">{displayValue(row.sho)}</td>
      <td className="p-3">{displayValue(row.hold)}</td>
      <td className="p-3">{displayValue(row.save)}</td>
      <td className="p-3">{displayValue(row.svo)}</td>
      <td className="p-3">{displayValue(row.ipDisplay || outsToIp(row.ipOuts))}</td>
      <td className="p-3">{displayValue(row.bf)}</td>
      <td className="p-3">{displayValue(row.h)}</td>
      <td className="p-3">{displayValue(row.runsAllowed)}</td>
      <td className="p-3">{displayValue(row.er)}</td>
      <td className="p-3">{displayValue(row.hr)}</td>
      <td className="p-3">{displayValue(row.pitchCount)}</td>
      <td className="p-3">{displayValue(row.hbp)}</td>
      <td className="p-3">{displayValue(row.bb)}</td>
      <td className="p-3">{displayValue(row.ibb)}</td>
      <td className="p-3">{displayValue(row.k)}</td>
      <td className="p-3">{displayValue(row.avgAgainst)}</td>
      <td className="p-3">{formatDecimal(row.whip)}</td>
      <td className="p-3">{formatRate(obpAgainst)}</td>
      <td className="p-3">{displayValue(row.goAo)}</td>
      <td className="p-3">{k9 != null ? formatDecimal(k9) : "-"}</td>
      <td className="p-3">{bb9 != null ? formatDecimal(bb9) : "-"}</td>
      <td className="p-3">{hr9 != null ? formatDecimal(hr9) : "-"}</td>
      <td className="p-3">{h9 != null ? formatDecimal(h9) : "-"}</td>
      <td className="p-3">{kbb != null ? formatDecimal(kbb) : "-"}</td>
      <td className="p-3">{formatPercent(kRate)}</td>
      <td className="p-3">{formatPercent(bbRate)}</td>
      <td className="p-3">{formatPercent(hrRate)}</td>
      <td className="p-3">{formatPercent(hbpRate)}</td>
    </tr>
  );
}

function TableHead({ headers }: { headers: string[] }) {
  return (
    <thead className="sticky top-0 z-40 bg-slate-800 text-slate-300">
      <tr>
        {headers.map((h) => {
          const stickyClass =
            h === "年份"
              ? "sticky left-0 z-30 w-[90px] min-w-[90px] bg-slate-800"
              : h === "球隊"
              ? "sticky left-[90px] z-30 w-[120px] min-w-[120px] bg-slate-800"
              : h === "層級"
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

  const sortedReports = [...visibleReports].sort((a, b) => {
    return String(b.report_date || "").localeCompare(String(a.report_date || ""));
  });

  const battingReports = sortedReports.filter(
    (report) => report.stat_type === "batting"
  );

  const pitchingReports = sortedReports.filter(
    (report) => report.stat_type === "pitching"
  );

  if (!battingReports.length && !pitchingReports.length) {
    return <div className="p-5 text-slate-400">目前沒有出賽紀錄</div>;
  }

  function groupByMonth(rows: any[]) {
    return rows.reduce((groups: Record<string, any[]>, row) => {
      const month = String(row.report_date || "").slice(0, 7) || "未知月份";

      if (!groups[month]) {
        groups[month] = [];
      }

      groups[month].push(row);
      return groups;
    }, {});
  }

  const battingGroups = groupByMonth(battingReports);
  let seasonHits = 0;
  let seasonWalks = 0;
  let seasonOuts = 0;

  const pitchingReportsWithCumulativeWhip = [...pitchingReports]
    .sort((a, b) => String(a.report_date || "").localeCompare(String(b.report_date || "")))
    .map((report) => {
      seasonHits += toNumber(report.h) ?? 0;
      seasonWalks += toNumber(report.bb) ?? 0;
      seasonOuts += toNumber(report.ip_outs) ?? 0;

      return {
        ...report,
        cumulativeWhip:
          seasonOuts > 0
            ? ((seasonHits + seasonWalks) / (seasonOuts / 3)).toFixed(2)
            : "-",
      };
    })
    .sort((a, b) => String(b.report_date || "").localeCompare(String(a.report_date || "")));

  const pitchingGroups = groupByMonth(pitchingReportsWithCumulativeWhip);

  return (
    <div className="space-y-6">
      {Object.entries(battingGroups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, reports]) => (
          <section key={`batting-${month}`} className="space-y-2">
            <h3 className="text-lg font-bold text-sky-300">{month} 打擊紀錄</h3>
            <BattingGameTable reports={reports} />
          </section>
        ))}

      {Object.entries(pitchingGroups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, reports]) => (
          <section key={`pitching-${month}`} className="space-y-2">
            <h3 className="text-lg font-bold text-sky-300">{month} 投球紀錄</h3>
            <PitchingGameTable reports={reports} />
          </section>
        ))}
    </div>
  );
}

const BATTING_GAME_HEADERS = [
  "日期",
  "球隊",
  "對手",
  "打數",
  "得分",
  "安打",
  "壘打數",
  "二壘打",
  "三壘打",
  "全壘打",
  "打點",
  "保送",
  "故意四壞",
  "三振",
  "盜壘",
  "盜壘失敗",
  "打擊率",
  "上壘率",
  "長打率",
  "觸身球",
  "高飛犧牲打",
];

const PITCHING_GAME_HEADERS = [
  "日期",
  "球隊",
  "對手",
  "勝",
  "敗",
  "防禦率",
  "出賽",
  "先發",
  "完投",
  "完封",
  "救援成功",
  "救援機會",
  "投球局數",
  "打者",
  "被安打",
  "失分",
  "責失",
  "被全壘打",
  "觸身球",
  "保送",
  "故意四壞",
  "三振",
  "球數",
  "被打擊率",
  "每局被上壘率",
];

const BATTING_GAME_COL_WIDTHS = [
  120,
  90,
  220,
  ...Array(BATTING_GAME_HEADERS.length - 3).fill(72),
];

const PITCHING_GAME_COL_WIDTHS = [
  120, // 日期
  90, // 球隊
  220, // 對手
  52, // 勝
  52, // 敗
  80, // 防禦率
  64, // 出賽
  64, // 先發
  64, // 完投
  64, // 完封
  84, // 救援成功
  84, // 救援機會
  84, // 投球局數
  64, // 打者
  72, // 被安打
  64, // 失分
  64, // 責失
  84, // 被全壘打
  72, // 觸身球
  72, // 保送
  84, // 故意四壞
  64, // 三振
  80, // 球數
  90, // 被打擊率
  110, // 每局被上壘率
];

const battingGameTableWidth = BATTING_GAME_COL_WIDTHS.reduce(
  (sum, width) => sum + width,
  0
);

const pitchingGameTableWidth = PITCHING_GAME_COL_WIDTHS.reduce(
  (sum, width) => sum + width,
  0
);

function getGameTeam(report: any) {
  return displayValue(
    report.team_name ||
      report.team ||
      report.players?.team_name ||
      report.players?.teams?.name_zh ||
      report.players?.teams?.name_en
  );
}

function formatGameDate(value: unknown) {
  const raw = text(value);
  if (!raw) return "-";
  return raw.slice(0, 10);
}

function formatGameIp(report: any) {
  const explicitOuts = toNumber(report.ip_outs);

  if (explicitOuts !== null) {
    return outsToIp(explicitOuts);
  }

  const raw = text(report.ip);
  if (!raw) return "-";

  // 舊資料若只存在 ip 欄位，ip 仍以棒球 IP 格式顯示，例如 5 / 5.1 / 5.2。
  if (!raw.includes(".")) return `${raw}.0`;

  return raw;
}

function getBattingGameTotal(reports: any[]) {
  return {
    ab: sumReportValues(reports, (report) => report.ab),
    r: sumReportValues(reports, (report) => report.r),
    h: sumReportValues(reports, (report) => report.h),
    tb: sumReportValues(reports, (report) => report.tb),
    doubles: sumReportValues(reports, (report) => report.doubles),
    triples: sumReportValues(reports, (report) => report.triples),
    hr: sumReportValues(reports, (report) => report.hr),
    rbi: sumReportValues(reports, (report) => report.rbi),
    bb: sumReportValues(reports, (report) => report.bb),
    ibb: sumReportValues(reports, (report) => report.ibb),
    k: sumReportValues(reports, (report) => report.k),
    sb: sumReportValues(reports, (report) => report.sb),
    cs: sumReportValues(reports, (report) => report.cs),
    hbp: sumReportValues(reports, (report) => report.hbp),
    sf: sumReportValues(reports, (report) => report.sf),
  };
}

function getPitchingGameTotal(reports: any[]) {
  return {
    ipOuts: sumReportIpOuts(reports),
    win: sumReportValues(reports, (report) => report.w ?? report.win ?? report.wins),
    loss: sumReportValues(reports, (report) => report.l ?? report.loss ?? report.losses),
    g: sumReportValues(reports, (report) => report.g ?? 1),
    gs: sumReportValues(reports, (report) => report.gs),
    cg: sumReportValues(reports, (report) => report.cg),
    sho: sumReportValues(reports, (report) => report.sho),
    save: sumReportValues(reports, (report) => report.sv ?? report.save),
    svo: sumReportValues(reports, (report) => report.svo),
    bf: sumReportValues(reports, (report) => report.bf ?? report.batters_faced ?? report.battersFaced),
    h: sumReportValues(reports, (report) => report.h),
    r: sumReportValues(reports, (report) => report.r),
    runsAllowed: sumReportValues(reports, (report) => report.r),
    er: sumReportValues(reports, (report) => report.er),
    hr: sumReportValues(reports, (report) => report.hr),
    bb: sumReportValues(reports, (report) => report.bb),
    ibb: sumReportValues(reports, (report) => report.ibb),
    k: sumReportValues(reports, (report) => report.k),
    hbp: sumReportValues(reports, (report) => report.hb ?? report.hbp),
    pitchCount: sumReportValues(reports, (report) => report.pitch_count),
  };
}

function BattingGameTable({ reports }: { reports: any[] }) {

  const total = getBattingGameTotal(reports);

  return (
    <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-800">
      <table
        className="table-fixed whitespace-nowrap text-sm"
        style={{ width: battingGameTableWidth }}
      >
        <colgroup>
          {BATTING_GAME_COL_WIDTHS.map((width, index) => (
            <col key={`batting-col-${index}`} style={{ width }} />
          ))}
        </colgroup>
      <thead className="sticky top-0 z-40 bg-slate-800 text-slate-300">
        <tr>
          {BATTING_GAME_HEADERS.map((h) => (
            <th
              key={h}
              className={
                h === "日期"
                  ? "sticky left-0 z-50 w-[120px] min-w-[120px] bg-slate-800 whitespace-nowrap p-3 text-left"
                  : "whitespace-nowrap p-3 text-left"
              }
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {reports.map((report) => (
          <tr
            key={report.id || `${report.report_date}-${report.result}`}
            className="border-t border-slate-800"
          >
            <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-slate-900 p-3">{formatGameDate(report.report_date)}</td>
            <td className="p-3">{getGameTeam(report)}</td>
            <td className="p-3 overflow-hidden text-ellipsis">{displayValue(report.opponent)}</td>

            <td className="p-3">{displayValue(toNumber(report.ab))}</td>
            <td className="p-3">{displayValue(toNumber(report.r))}</td>
            <td className="p-3">{displayValue(toNumber(report.h))}</td>
            <td className="p-3">{displayValue(toNumber(report.tb))}</td>
            <td className="p-3">{displayValue(toNumber(report.doubles))}</td>
            <td className="p-3">{displayValue(toNumber(report.triples))}</td>
            <td className="p-3">{displayValue(toNumber(report.hr))}</td>
            <td className="p-3">{displayValue(toNumber(report.rbi))}</td>
            <td className="p-3">{displayValue(toNumber(report.bb))}</td>
            <td className="p-3">{displayValue(toNumber(report.ibb))}</td>
            <td className="p-3">{displayValue(toNumber(report.k))}</td>
            <td className="p-3">{displayValue(toNumber(report.sb))}</td>
            <td className="p-3">{displayValue(toNumber(report.cs))}</td>

            <td className="p-3">{displayValue(report.avg)}</td>
            <td className="p-3">{displayValue(report.obp)}</td>
            <td className="p-3">{displayValue(report.slg)}</td>

            <td className="p-3">{displayValue(toNumber(report.hbp))}</td>
            <td className="p-3">{displayValue(toNumber(report.sf))}</td>
          </tr>
        ))}

          <tr className="border-t border-slate-700 bg-slate-800/60 font-bold">
            <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-slate-800 p-3">
              月合計
            </td>

            <td className="p-3">-</td>
            <td className="p-3 overflow-hidden text-ellipsis">-</td>

            <td className="p-3">{displayValue(total.ab)}</td>
            <td className="p-3">{displayValue(total.r)}</td>
            <td className="p-3">{displayValue(total.h)}</td>
            <td className="p-3">{displayValue(total.tb)}</td>
            <td className="p-3">{displayValue(total.doubles)}</td>
            <td className="p-3">{displayValue(total.triples)}</td>
            <td className="p-3">{displayValue(total.hr)}</td>
            <td className="p-3">{displayValue(total.rbi)}</td>
            <td className="p-3">{displayValue(total.bb)}</td>
            <td className="p-3">{displayValue(total.ibb)}</td>
            <td className="p-3">{displayValue(total.k)}</td>
            <td className="p-3">{displayValue(total.sb)}</td>
            <td className="p-3">{displayValue(total.cs)}</td>

            <td className="p-3">
              {formatRate(safeDivide(total.h, total.ab))}
            </td>

            <td className="p-3">-</td>
            <td className="p-3">-</td>

            <td className="p-3">{displayValue(total.hbp)}</td>
            <td className="p-3">{displayValue(total.sf)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PitchingGameTable({ reports }: { reports: any[] }) {

  const total = getPitchingGameTotal(reports);
  
  let cumulativeHits = 0;
  let cumulativeWalks = 0;
  let cumulativeOuts = 0;

  return (
    <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-800">
      <table
        className="table-fixed whitespace-nowrap text-sm"
        style={{ width: pitchingGameTableWidth }}
      >
        <colgroup>
          {PITCHING_GAME_COL_WIDTHS.map((width, index) => (
            <col key={`pitching-col-${index}`} style={{ width }} />
          ))}
        </colgroup>
      <thead className="sticky top-0 z-40 bg-slate-800 text-slate-300">
        <tr>
          {PITCHING_GAME_HEADERS.map((h) => (
            <th
              key={h}
              className={
                h === "日期"
                  ? "sticky left-0 z-50 w-[120px] min-w-[120px] bg-slate-800 whitespace-nowrap p-3 text-left"
                  : "whitespace-nowrap p-3 text-left"
              }
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {reports.map((report) => {

          const outs = toNumber(report.ip_outs);

          cumulativeHits += toNumber(report.h) ?? 0;
          cumulativeWalks += toNumber(report.bb) ?? 0;
          cumulativeOuts += outs ?? 0;

          const cumulativeWhip =
            cumulativeOuts > 0
              ? (
                  (cumulativeHits + cumulativeWalks) /
                  (cumulativeOuts / 3)
                ).toFixed(2)
              : "-";

          return (

            <tr
              key={report.id || `${report.report_date}-${report.result}`}
              className="border-t border-slate-800"
            >
              <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-slate-900 p-3">{formatGameDate(report.report_date)}</td>
              <td className="p-3">{getGameTeam(report)}</td>
              <td className="p-3 overflow-hidden text-ellipsis">{displayValue(report.opponent)}</td>

              <td className="p-3">{displayValue(toNumber(report.w ?? report.win ?? report.wins))}</td>
              <td className="p-3">{displayValue(toNumber(report.l ?? report.loss ?? report.losses))}</td>
              <td className="p-3">{displayValue(report.era)}</td>
              <td className="p-3">{displayValue(toNumber(report.g ?? 1))}</td>
              <td className="p-3">{displayValue(toNumber(report.gs))}</td>
              <td className="p-3">{displayValue(toNumber(report.cg))}</td>
              <td className="p-3">{displayValue(toNumber(report.sho))}</td>
              <td className="p-3">{displayValue(toNumber(report.sv ?? report.save))}</td>
              <td className="p-3">{displayValue(toNumber(report.svo))}</td>

              <td className="p-3">{formatGameIp(report)}</td>
              <td className="p-3">{displayValue(toNumber(report.bf ?? report.batters_faced ?? report.battersFaced))}</td>
              <td className="p-3">{displayValue(toNumber(report.h))}</td>
              <td className="p-3">{displayValue(toNumber(report.r))}</td>
              <td className="p-3">{displayValue(toNumber(report.er))}</td>
              <td className="p-3">{displayValue(toNumber(report.hr))}</td>
              <td className="p-3">{displayValue(toNumber(report.hb ?? report.hbp))}</td>
              <td className="p-3">{displayValue(toNumber(report.bb))}</td>
              <td className="p-3">{displayValue(toNumber(report.ibb))}</td>
              <td className="p-3">{displayValue(toNumber(report.k))}</td>
              <td className="p-3">
                {displayValue(
                  report.np_s ||
                  report.nps ||
                  report.pitch_count
                )}
              </td>
              <td className="p-3">{displayValue(report.avg)}</td>
              <td className="p-3">{displayValue(report.cumulativeWhip)}</td>
            </tr>
          );
        })}

          <tr className="border-t border-slate-700 bg-slate-800/60 font-bold">
            <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-slate-800 p-3">
              月合計
            </td>

            <td className="p-3">-</td>
            <td className="p-3 overflow-hidden text-ellipsis">-</td>

            <td className="p-3">{displayValue(total.win)}</td>
            <td className="p-3">{displayValue(total.loss)}</td>

            <td className="p-3">
              {formatDecimal(
                safeDivide(total.er !== null ? total.er * 9 : null, total.ipOuts !== null ? total.ipOuts / 3 : null)
              )}
            </td>

            <td className="p-3">{displayValue(total.g)}</td>
            <td className="p-3">{displayValue(total.gs)}</td>
            <td className="p-3">{displayValue(total.cg)}</td>
            <td className="p-3">{displayValue(total.sho)}</td>
            <td className="p-3">{displayValue(total.save)}</td>
            <td className="p-3">{displayValue(total.svo)}</td>

            <td className="p-3">
              {outsToIp(total.ipOuts)}
            </td>

            <td className="p-3">{displayValue(total.bf)}</td>
            <td className="p-3">{displayValue(total.h)}</td>
            <td className="p-3">{displayValue(total.runsAllowed)}</td>
            <td className="p-3">{displayValue(total.er)}</td>
            <td className="p-3">{displayValue(total.hr)}</td>
            <td className="p-3">{displayValue(total.hbp)}</td>
            <td className="p-3">{displayValue(total.bb)}</td>
            <td className="p-3">{displayValue(total.ibb)}</td>
            <td className="p-3">{displayValue(total.k)}</td>
            <td className="p-3">{displayValue(total.pitchCount)}</td>

            <td className="p-3">-</td>

            <td className="p-3">
              {formatDecimal(
                safeDivide(
                  total.bb !== null && total.h !== null ? total.bb + total.h : null,
                  total.ipOuts !== null ? total.ipOuts / 3 : null
                )
              )}
            </td>
          </tr>
      </tbody>
      </table>
    </div>
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