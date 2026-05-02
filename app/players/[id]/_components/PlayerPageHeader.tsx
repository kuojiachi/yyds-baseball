type PlayerPageHeaderProps = {
  player: any;
  showBackLink?: boolean;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function displayValue(value: unknown) {
  const v = text(value);
  return v || "-";
}

function displayLeague(league: unknown) {
  const v = text(league);

  if (v === "MLB" || v === "MiLB") return "美職";
  if (v === "NPB") return "日職";
  if (v === "KBO") return "韓職";

  return v || "-";
}

function isPitcher(player: any) {
  const position = text(player.position).toLowerCase();
  return position.includes("投") || position.includes("pitcher") || position === "p";
}

export default function PlayerPageHeader({
  player,
  showBackLink = false,
}: PlayerPageHeaderProps) {
  const playerRole = isPitcher(player) ? "投手" : "野手";

  return (
    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
      {showBackLink ? (
        <a
          href={`/players/${player.id}`}
          className="mb-4 inline-block text-sm text-slate-400 hover:text-white"
        >
          ← 回球員頁
        </a>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {displayLeague(player.league)}｜{displayValue(player.level)}
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-wide">
            {player.name_zh}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {displayValue(player.name_en)}
          </p>
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
          {playerRole}
        </div>
      </div>
    </div>
  );
}