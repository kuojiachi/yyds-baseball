"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getEventDisplay } from "@/src/utils/playerEvents";

type Player = any;

type PlayersTableProps = {
  players: Player[];
  events: any[];
};

const LEVEL_ORDER: Record<string, number> = {
  MLB: 1,
  "3A": 2,
  AAA: 2,
  "2A": 3,
  AA: 3,
  "A+": 4,
  "1A": 5,
  RK: 6,
  "日職一軍": 7,
  "日職二軍": 8,
  "韓職一軍": 9,
};

const LEAGUE_OPTIONS = ["美職", "日職", "韓職", "台裔", "其他"];
const LEVEL_OPTIONS = ["MLB", "3A", "2A", "A+", "1A", "RK", "日職一軍", "日職二軍", "韓職一軍"];
const POSITION_OPTIONS = ["投手", "捕手", "內野手", "外野手"];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function getTeam(row: any) {
  const teams = row?.teams;
  return Array.isArray(teams) ? teams[0] : teams;
}

function getTeamName(row: any) {
  const team = getTeam(row);

  return (
    text(team?.name_zh) ||
    text(team?.name_en) ||
    text(team?.code) ||
    text(row.team_name) ||
    "-"
  );
}

function normalizeLeague(league: unknown): string {
  const value = text(league);

  if (value === "MLB" || value === "MiLB") return "美職";
  if (value === "NPB") return "日職";
  if (value === "KBO") return "韓職";

  return value || "其他";
}

function levelRank(level: unknown) {
  return LEVEL_ORDER[text(level)] ?? 999;
}

function isWithinLastDays(dateValue: unknown, days: number) {
  const value = text(dateValue);
  if (!value) return false;

  const eventDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  return eventDate >= startDate && eventDate <= today;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function CheckboxGroup({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-slate-400 text-sm mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = values.includes(option);

          return (
            <label
              key={option}
              className={[
                "cursor-pointer rounded-lg border px-3 py-2 text-sm transition",
                checked
                  ? "border-sky-500 bg-sky-500/20 text-sky-200"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleValue(values, option))}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayersTable({ players, events }: PlayersTableProps) {
  const [searchText, setSearchText] = useState("");
  const [uiLeagues, setUiLeagues] = useState<string[]>([]);
  const [uiLevels, setUiLevels] = useState<string[]>([]);
  const [uiPositions, setUiPositions] = useState<string[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  const playerMap = useMemo(() => {
    const map: Record<string, any> = {};

    for (const event of events) {
      const key = event.player_id || event.name_zh;
      if (!map[key]) map[key] = event;
    }

    return map;
  }, [events]);

  const filteredPlayers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return [...players]
      .filter((player: any) => {
        const name = text(player.name_zh).toLowerCase();
        const nameEn = text(player.name_en).toLowerCase();
        const team = getTeamName(player).toLowerCase();
        const league = normalizeLeague(player.league);
        const level = text(player.level);
        const position = text(player.position);

        if (
          keyword &&
          ![name, nameEn, team, league, level, position].join(" ").includes(keyword)
        ) {
          return false;
        }

        if (selectedLeagues.length > 0 && !selectedLeagues.includes(league)) {
          return false;
        }

        if (selectedLevels.length > 0 && !selectedLevels.includes(level)) {
          return false;
        }

        if (selectedPositions.length > 0 && !selectedPositions.includes(position)) {
          return false;
        }

        return true;
      })
      .sort((a: any, b: any) => levelRank(a.level) - levelRank(b.level));
  }, [players, searchText, selectedLeagues, selectedLevels, selectedPositions]);

  function clearFilters() {
    setSearchText("");
    setSelectedLeagues([]);
    setSelectedLevels([]);
    setSelectedPositions([]);
  }

  return (
    <>
      <details className="bg-slate-900 rounded-2xl border border-slate-800 mb-6 p-5">
        <summary className="list-none cursor-pointer inline-flex w-fit items-center rounded border border-slate-700 px-1.5 py-0 text-xs leading-5 text-slate-300 hover:bg-slate-800">
          篩選條件
        </summary>

        <div className="mt-5 space-y-5">
          <label className="block">
            <p className="text-slate-400 text-sm mb-2">搜尋球員</p>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜尋球員、球隊、聯盟、層級、守位..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white placeholder:text-slate-500"
            />
          </label>

          <CheckboxGroup
            title="聯盟"
            options={LEAGUE_OPTIONS}
            values={uiLeagues}
            onChange={setUiLeagues}
          />

          <CheckboxGroup
            title="層級"
            options={LEVEL_OPTIONS}
            values={uiLevels}
            onChange={setUiLevels}
          />

          <CheckboxGroup
            title="守位"
            options={POSITION_OPTIONS}
            values={uiPositions}
            onChange={setUiPositions}
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedLeagues(uiLeagues);
                setSelectedLevels(uiLevels);
                setSelectedPositions(uiPositions);
              }}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500"
            >
              套用篩選
            </button>

            <button
              onClick={() => {
                setUiLeagues([]);
                setUiLevels([]);
                setUiPositions([]);
                setSelectedLeagues([]);
                setSelectedLevels([]);
                setSelectedPositions([]);
              }}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              清除篩選
            </button>
          </div>
        </div>
      </details>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold">完整追蹤名單</h2>
          <p className="text-slate-400 text-sm mt-1">
            追蹤球員：{filteredPlayers.length} 人
          </p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="p-3 text-left">球員</th>
                <th className="p-3 text-left">守位</th>
                <th className="p-3 text-left">聯盟</th>
                <th className="p-3 text-left">球隊</th>
                <th className="p-3 text-left">層級</th>
                <th className="p-3 text-left">升降</th>
                <th className="p-3 text-left">狀態</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.map((player: any) => {
                const key = player.id || player.name_zh;
                const event = playerMap[key];
                const eventDisplay = event ? getEventDisplay(event) : null;

                const movement =
                  eventDisplay?.type === "movement" &&
                  isWithinLastDays(event?.event_date, 7)
                    ? eventDisplay.label
                    : "-";

                const rawStatus =
                  eventDisplay?.type === "status"
                    ? eventDisplay.label
                    : player.status || "active";

                const playerStatus =
                  rawStatus === "active" || rawStatus === "現役"
                    ? "-"
                    : rawStatus;

                return (
                  <tr
                    key={key}
                    className="border-t border-slate-800 hover:bg-slate-800/60"
                  >
                    <td className="p-3">
                      <Link
                        href={player.id ? `/players/${player.id}` : "#"}
                        className="text-sky-300 hover:underline"
                      >
                        {player.name_zh}
                      </Link>
                    </td>

                    <td className="p-3">{player.position || "-"}</td>
                    <td className="p-3">{normalizeLeague(player.league)}</td>
                    <td className="p-3">
                      {getTeamName(player)}
                    </td>
                    <td className="p-3">{player.level || "-"}</td>
                    <td className="p-3 text-green-400">{movement}</td>
                    <td className="p-3 text-yellow-400">{playerStatus}</td>
                  </tr>
                );
              })}

              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    找不到符合條件的球員
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}