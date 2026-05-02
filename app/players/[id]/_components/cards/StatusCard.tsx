type StatusCardProps = {
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

function getStatusClass(status: string) {
  if (status === "現役" || status === "active") return "text-green-400";
  if (status === "傷兵" || status === "IL60" || status === "IL10" || status === "IL15" || status === "IL7") return "text-yellow-400";
  if (status === "DFA") return "text-orange-400";
  if (status === "自由球員" || status === "釋出") return "text-red-400";
  return "text-slate-300";
}

function getLatestStatusEvent(playerEvents: any[]) {
  return playerEvents.find((event) => {
    const eventType = text(event.event_type).toLowerCase();
    return (
      eventType === "injury" ||
      eventType === "active" ||
      eventType === "dfa" ||
      eventType === "free_agent"
    );
  });
}

function getStatusFromEvent(event: any) {
  const eventType = text(event?.event_type).toLowerCase();

  if (eventType === "injury") return "傷兵";
  if (eventType === "active") return "現役";
  if (eventType === "dfa") return "DFA";
  if (eventType === "free_agent") return "自由球員";

  return "";
}

export default function StatusCard({ player, playerEvents }: StatusCardProps) {
  const latestStatusEvent = getLatestStatusEvent(playerEvents);

  const rawStatus =
    getStatusFromEvent(latestStatusEvent) ||
    displayValue(player.status || "現役");

  const status =
    rawStatus === "IL60" ||
    rawStatus === "IL10" ||
    rawStatus === "IL15" ||
    rawStatus === "IL7"
      ? "傷兵"
      : rawStatus;

  const subText = latestStatusEvent
    ? displayValue(latestStatusEvent.event_date)
    : "目前狀態";

  return (
    <a
      href={player.id ? `/players/${player.id}/events?kind=status` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
    >
      <div className="text-sm text-slate-400">狀態</div>

      <div className="mt-2 text-lg font-bold">
        <span className={getStatusClass(status)}>{status}</span>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {subText}
      </div>
    </a>
  );
}