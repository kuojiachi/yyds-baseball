type PlayerPageHeaderProps = {
  player: any;
  playerEvents?: any[];
  playerReports?: any[];
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

function displayStatus(status: unknown) {
  const v = text(status);

  if (v === "IL60" || v === "IL10" || v === "IL15" || v === "IL7") {
    return "傷兵";
  }

  return v || "現役";
}

function getTeam(player: any) {
  return Array.isArray(player.teams) ? player.teams[0] : player.teams;
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

function displayHand(value: unknown) {
  const v = text(value).toUpperCase();

  if (v === "R") return "右";
  if (v === "L") return "左";
  if (v === "S") return "左右";

  return displayValue(value);
}

function getBatsThrows(player: any) {
  const bats = displayValue(player.bats);
  const throws = displayValue(player.throws);

  if (bats === "-" && throws === "-") return "-";
  return `${displayHand(throws)}投${displayHand(bats)}打`;
}

function getAge(birthDate: unknown) {
  const value = text(birthDate);
  if (!value) return "-";

  const birthday = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthday.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();

  const notBirthdayYet =
    today.getMonth() < birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() &&
      today.getDate() < birthday.getDate());

  if (notBirthdayYet) age -= 1;

  return `${age}歲`;
}

function getJoinMethod(playerEvents: any[]) {
  const draftEvent = playerEvents.find((event) => {
    const eventType = text(event.event_type).toLowerCase();
    return eventType === "draft";
  });

  if (draftEvent) {
    return displayValue(draftEvent.note || draftEvent.event_type);
  }

  const signEvent = playerEvents.find((event) => {
    const eventType = text(event.event_type).toLowerCase();
    return eventType === "sign";
  });

  if (signEvent) {
    return displayValue(signEvent.note || signEvent.event_type);
  }

  return "簽約";
}

function InfoItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="border-l border-slate-700 pl-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-base font-bold text-white">
        {displayValue(value)}
      </div>
    </div>
  );
}

export default function PlayerPageHeader({
  player,
  playerEvents = [],
  playerReports = [],
  showBackLink = false,
}: PlayerPageHeaderProps) {

  return (
    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">

      {/* 回上一頁 */}
      {showBackLink ? (
        <a
          href={`/players/${player.id}`}
          className="mb-4 inline-block text-sm text-slate-400 hover:text-white"
        >
          ← 回球員頁
        </a>
      ) : (
        <a
          href="/players"
          className="mb-4 inline-block text-sm text-slate-400 hover:text-white"
        >
          ← 回球員總表
        </a>
      )}

      {/* 標題區 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* 左：名字 */}
        <div>
          <h1 className="text-4xl font-bold tracking-wide">
            {player.name_zh}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {displayValue(player.name_en)}
          </p>
        </div>

        {/* 右：兩張卡（橫向） */}
        {!showBackLink && (
          <div className="grid grid-cols-2 gap-3 md:w-[520px]">

            <a
              href={player.id ? `/players/${player.id}/games` : "#"}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
            >
              <div className="text-sm text-slate-400">今年出賽</div>
              <div className="mt-2 text-lg font-bold text-white">
                今年 {playerReports.length} 場
              </div>
            </a>

            <a
              href={player.id ? `/players/${player.id}/events` : "#"}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-800/60 transition"
            >
              <div className="text-sm text-slate-400">球員狀態總覽</div>
              <div className="mt-2 text-lg font-bold text-white">
                {displayStatus(player.status)}｜{displayValue(player.level)}｜{getTeamName(player)}
              </div>
            </a>

          </div>
        )}
      </div>

      {/* 資料欄位 */}
      {!showBackLink && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-5">
          <InfoItem label="聯盟" value={displayLeague(player.league)} />
          <InfoItem label="球隊" value={getTeamName(player)} />
          <InfoItem label="層級" value={player.level} />
          <InfoItem label="狀態" value={displayStatus(player.status)} />
          <InfoItem label="守位" value={player.position} />
          <InfoItem label="投打習慣" value={getBatsThrows(player)} />
          <InfoItem label="生日" value={player.birth_date} />
          <InfoItem label="年齡" value={getAge(player.birth_date)} />
          <InfoItem label="國籍" value={player.nationality} />
          <InfoItem label="入隊方式" value={getJoinMethod(playerEvents)} />
        </div>
      )}

    </div>
  );
}