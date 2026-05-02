type TeamCardProps = {
  player: any;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function displayValue(value: unknown) {
  const v = text(value);
  return v || "-";
}

function getTeamName(player: any) {
  return displayValue(
    player.teams?.abbreviation ||
      player.teams?.name_zh ||
      player.teams?.name_en ||
      player.team_name ||
      player.team
  );
}

export default function TeamCard({ player }: TeamCardProps) {
  return (
    <a
      href={player.id ? `/players/${player.id}/events?kind=team` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
    >
      <div className="text-sm text-slate-400">球隊</div>

      <div className="mt-2 text-lg font-bold text-white">
        {getTeamName(player)}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        點擊查看球隊歷史
      </div>
    </a>
  );
}