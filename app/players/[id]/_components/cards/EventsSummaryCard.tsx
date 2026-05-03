type EventsSummaryCardProps = {
  player: any;
  playerEvents: any[];
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function displayValue(value: unknown) {
  const v = text(value);
  return v || "-";
}

function getTeam(player: any) {
  return Array.isArray(player.teams) ? player.teams[0] : player.teams;
}

function getTeamName(player: any) {
  const team = getTeam(player);

  return displayValue(
    team?.code ||
      team?.name_zh ||
      team?.name_en ||
      player.team_name
  );
}

function displayStatus(status: unknown) {
  const v = text(status);

  if (v === "IL60" || v === "IL10" || v === "IL15" || v === "IL7") {
    return "傷兵";
  }

  return v || "現役";
}

export default function EventsSummaryCard({
  player,
  playerEvents,
}: EventsSummaryCardProps) {
  const latestEvent = playerEvents[0];

  return (
    <a
      href={player.id ? `/players/${player.id}/events` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
    >
      <div className="text-sm text-slate-400">球員狀態總覽</div>

      <div className="mt-2 text-lg font-bold text-white">
        {displayStatus(player.status)}｜{displayValue(player.level)}｜{getTeamName(player)}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        最近事件：
        {latestEvent
          ? `${displayValue(latestEvent.event_date)} ${displayValue(latestEvent.note || latestEvent.event_type)}`
          : "目前沒有事件紀錄"}
      </div>
    </a>
  );
}