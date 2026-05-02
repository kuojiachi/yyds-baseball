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
  const fromLevel = text(event.from_level);
  const toLevel = text(event.to_level);

  const team = toTeam || fromTeam || "-";
  const level = toLevel || fromLevel || "-";

  if (eventType === "promotion") {
    return {
      label: toLevel ? `↑ 升${toLevel}` : "升級",
      type: "movement",
      team,
      level,
      colorClass: "text-green-400",
    };
  }

  if (eventType === "demotion") {
    return {
      label: toLevel ? `↓ 降${toLevel}` : "降級",
      type: "movement",
      team,
      level,
      colorClass: "text-red-400",
    };
  }

  if (eventType === "transfer") {
    return {
      label: toTeam ? `轉隊 ${toTeam}` : "轉隊",
      type: "movement",
      team,
      level,
      colorClass: "text-sky-300",
    };
  }

  if (eventType === "signed") {
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

  if (eventType === "released") {
    return {
      label: "釋出",
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