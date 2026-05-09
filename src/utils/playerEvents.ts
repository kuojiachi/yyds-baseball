export type PlayerEvent = {
  id?: string | null;
  player_id?: string | null;
  name_zh?: string | null;
  event_date?: string | null;
  event_type?: string | null;
  from_team?: string | null;
  to_team?: string | null;
  from_level?: string | null;
  to_level?: string | null;
  league?: string | null;
  note?: string | null;
  created_at?: string | null;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeLevel(value: unknown, league?: unknown) {
  const raw = text(value);
  const leagueText = text(league);

  if (!raw) return "";

  if (raw === "日職一軍" || raw === "NPB一軍") return "日職一軍";
  if (raw === "日職二軍" || raw === "NPB二軍") return "日職二軍";
  if (raw === "韓職一軍" || raw === "KBO一軍") return "韓職一軍";
  if (raw === "韓職二軍" || raw === "KBO二軍") return "韓職二軍";

  if (raw === "一軍") {
    if (leagueText.includes("韓") || leagueText.toUpperCase().includes("KBO")) {
      return "韓職一軍";
    }
    return "日職一軍";
  }

  if (raw === "二軍") {
    if (leagueText.includes("韓") || leagueText.toUpperCase().includes("KBO")) {
      return "韓職二軍";
    }
    return "日職二軍";
  }

  return raw;
}

export function displayShortLevel(value: unknown, league?: unknown) {
  const level = normalizeLevel(value, league);

  if (level === "日職一軍" || level === "韓職一軍") return "一軍";
  if (level === "日職二軍" || level === "韓職二軍") return "二軍";

  return level || "-";
}

export function formatEventDate(value: unknown) {
  const raw = text(value);
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

export function getEventDisplay(event: PlayerEvent) {
  const eventType = text(event.event_type);
  const fromTeam = text(event.from_team);
  const toTeam = text(event.to_team);

  const fromLevel = normalizeLevel(event.from_level, event.league);
  const toLevel = normalizeLevel(event.to_level, event.league);

  const team = toTeam || fromTeam || "-";
  const level = toLevel || fromLevel || "-";

  if (eventType === "promotion" || eventType === "recall") {
    return {
      label: `↑ 升${displayShortLevel(toLevel || "一軍", event.league)}`,
      type: "movement",
      team,
      level,
      colorClass: "text-green-400",
    };
  }

  if (eventType === "demotion" || eventType === "option") {
    return {
      label: `↓ 降${displayShortLevel(toLevel || "二軍", event.league)}`,
      type: "movement",
      team,
      level,
      colorClass: "text-red-400",
    };
  }

  if (eventType === "transfer" || eventType === "trade") {
    return {
      label: toTeam ? `轉隊 ${toTeam}` : "轉隊",
      type: "movement",
      team,
      level,
      colorClass: "text-sky-300",
    };
  }

  if (eventType === "signed" || eventType === "sign") {
    return {
      label: "簽約",
      type: "movement",
      team,
      level,
      colorClass: "text-sky-300",
    };
  }

  if (eventType === "injury") {
    return {
      label: "傷兵",
      type: "status",
      team,
      level,
      colorClass: "text-yellow-400",
    };
  }

  if (eventType === "rehab") {
    return {
      label: "復健賽",
      type: "status",
      team,
      level,
      colorClass: "text-yellow-400",
    };
  }

  if (eventType === "active") {
    return {
      label: `↑ 升${displayShortLevel(toLevel || "一軍", event.league)}`,
      type: "movement",
      team,
      level: toLevel || normalizeLevel("一軍", event.league),
      colorClass: "text-green-400",
    };
  }

  if (eventType === "activated") {
    return {
      label: "現役",
      type: "status",
      team,
      level,
      colorClass: "text-green-400",
    };
  }

  if (eventType === "dfa") {
    return {
      label: "DFA",
      type: "status",
      team,
      level,
      colorClass: "text-orange-400",
    };
  }

  if (eventType === "released" || eventType === "free_agent") {
    return {
      label: eventType === "free_agent" ? "自由球員" : "釋出",
      type: "status",
      team,
      level,
      colorClass: "text-red-400",
    };
  }

  return {
    label: eventType || "-",
    type: "unknown",
    team,
    level,
    colorClass: "text-slate-400",
  };
}