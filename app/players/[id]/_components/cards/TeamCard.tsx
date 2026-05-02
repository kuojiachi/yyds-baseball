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

function getTeam(player: any) {
  return Array.isArray(player.teams) ? player.teams[0] : player.teams;
}

function getTeamCode(player: any) {
  const team = getTeam(player);
  return displayValue(team?.code || team?.abbreviation);
}

function getTeamName(player: any) {
  const team = getTeam(player);

  return displayValue(
    team?.name_zh ||
      team?.name_en ||
      player.team_name ||
      player.team
  );
}

export default function TeamCard({ player }: TeamCardProps) {
  const teamCode = getTeamCode(player);
  const teamName = getTeamName(player);

  return (
    <a
      href={player.id ? `/players/${player.id}/events?kind=team` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
    >
      <div className="text-sm text-slate-400">球隊</div>

      <div className="mt-2 text-lg font-bold text-white">
        {teamCode}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {teamName}
      </div>
    </a>
  );
}