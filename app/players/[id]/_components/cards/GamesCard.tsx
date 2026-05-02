type GamesCardProps = {
  player: any;
  playerReports: any[];
};

export default function GamesCard({ player, playerReports }: GamesCardProps) {
  const games = playerReports.length;

  return (
    <a
      href={player.id ? `/players/${player.id}/games` : "#"}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition md:col-span-2"
    >
      <div className="text-sm text-slate-400">今年出賽</div>

      <div className="mt-2 text-lg font-bold text-white">
        今年 {games} 場
      </div>

      <div className="mt-2 text-xs text-slate-500">
        點擊查看出賽紀錄
      </div>
    </a>
  );
}