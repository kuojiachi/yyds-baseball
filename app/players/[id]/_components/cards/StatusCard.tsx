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
  if (status === "現役") return "text-green-400";
  if (status === "傷兵") return "text-yellow-400";
  if (status === "DFA") return "text-orange-400";
  if (status === "釋出") return "text-red-400";
  return "text-slate-300";
}

function getLatestStatusEvent(playerEvents: any[]) {
  return playerEvents.find((event) => {
    const eventType = text(event.event_type).toLowerCase();
    return (
      eventType === "injured" ||
      eventType === "activated" ||
      eventType === "dfa" ||
      eventType === "released" ||
      eventType === "status"
    );
  });
}

function getStatusFromEvent(event: any) {
  const eventType = text(event?.event_type).toLowerCase();

  if (eventType === "injured") return "傷兵";
  if (eventType === "activated") return "現役";
  if (eventType === "dfa") return "DFA";
  if (eventType === "released") return "釋出";

  return text(event?.status_value) || text(event?.note);
}

export default function StatusCard({ player, playerEvents }: StatusCardProps) {
  const latestStatusEvent = getLatestStatusEvent(playerEvents);

  const status =
    getStatusFromEvent(latestStatusEvent) ||
    displayValue(player.status || "現役");

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