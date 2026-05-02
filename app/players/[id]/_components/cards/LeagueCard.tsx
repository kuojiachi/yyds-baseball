type LeagueCardProps = {
  player: any;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function displayLeague(league: unknown) {
  const v = text(league);

  if (v === "MLB" || v === "MiLB") return "美職";
  if (v === "NPB") return "日職";
  if (v === "KBO") return "韓職";

  return v || "-";
}

export default function LeagueCard({ player }: LeagueCardProps) {
  return (
    <a
      href={player.id ? `/players/${player.id}/events?kind=league` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
    >
      <div className="text-sm text-slate-400">聯盟</div>

      <div className="mt-2 text-lg font-bold text-white">
        {displayLeague(player.league)}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        點擊查看聯盟歷史
      </div>
    </a>
  );
}