type LevelCardProps = {
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

function getMovementClass(movement: string) {
  if (movement.includes("↑")) return "text-green-400";
  if (movement.includes("↓")) return "text-red-400";
  return "text-slate-400";
}

function getLatestLevelEvent(playerEvents: any[]) {
  return playerEvents.find((event) => {
    const eventType = text(event.event_type).toLowerCase();
    return (
      eventType === "promotion" ||
      eventType === "option" ||
      eventType === "recall" ||
      eventType === "assign"
    );
  });
}

function getMovementText(event: any) {
  const eventType = text(event?.event_type).toLowerCase();
  const toLevel = displayValue(event?.to_level);

  if (eventType === "promotion") return `↑ 升${toLevel}`;
  if (eventType === "recall") return `↑ 召回${toLevel}`;
  if (eventType === "option") return `↓ 下放${toLevel}`;
  if (eventType === "assign") return `指派${toLevel}`;

  return "近一周無升降";
}

export default function LevelCard({ player, playerEvents }: LevelCardProps) {
  const latestLevelEvent = getLatestLevelEvent(playerEvents);

  const level = displayValue(player.level);

  const movement = latestLevelEvent
    ? getMovementText(latestLevelEvent)
    : "近一周無升降";

  const subText = latestLevelEvent
    ? displayValue(latestLevelEvent.event_date)
    : "目前層級";

  return (
    <a
      href={player.id ? `/players/${player.id}/events?kind=level` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
    >
      <div className="text-sm text-slate-400">層級</div>

      <div className="mt-2 text-lg font-bold text-white">
        {level}
      </div>

      <div className={`mt-1 text-sm font-semibold ${getMovementClass(movement)}`}>
        {movement}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {subText}
      </div>
    </a>
  );
}