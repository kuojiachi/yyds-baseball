import SiteHeader from "@/src/components/SiteHeader";
import { getPlayers } from "@/src/lib/players";
import { getPlayerEvents } from "@/src/lib/playerEvents";
import { getPlayerNameOptions } from "@/src/utils/playerNameOptions";
import PlayerPageHeader from "../_components/PlayerPageHeader";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    kind?: string;
  }>;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function displayValue(value: unknown) {
  const v = text(value);
  return v || "-";
}

function getRelatedPlayer(row: any) {
  return Array.isArray(row.players) ? row.players[0] : row.players;
}

const kindTitleMap: Record<string, string> = {
  status: "狀態歷史",
  level: "層級歷史",
  team: "球隊歷史",
  league: "聯盟歷史",
};

function isTargetEvent(event: any, kind: string) {
  const eventType = text(event.event_type).toLowerCase();
  const note = text(event.note);

  if (kind === "status") {
    return (
      eventType === "injured" ||
      eventType === "activated" ||
      eventType === "dfa" ||
      eventType === "released" ||
      eventType === "status" ||
      note.includes("IL") ||
      note.includes("傷兵") ||
      note.includes("復出") ||
      note.includes("DFA") ||
      note.includes("釋出")
    );
  }

  if (kind === "level") {
    return (
      eventType === "promotion" ||
      eventType === "option" ||
      eventType === "recall" ||
      eventType === "assign"
    );
  }

  if (kind === "team") {
    return (
      eventType === "signed" ||
      eventType === "transfer" ||
      eventType === "trade" ||
      eventType === "team" ||
      note.includes("加入") ||
      note.includes("轉隊") ||
      note.includes("交易") ||
      note.includes("簽約")
    );
  }

  if (kind === "league") {
    return (
      eventType === "league" ||
      note.includes("美職") ||
      note.includes("日職") ||
      note.includes("韓職")
    );
  }

  return true;
}

function getEventContent(event: any, kind: string) {
  const eventType = text(event.event_type).toLowerCase();

  if (kind === "status") {
    if (eventType === "injured") return "進入傷兵名單";
    if (eventType === "activated") return "復出";
    if (eventType === "dfa") return "DFA";
    if (eventType === "released") return "釋出";
    return displayValue(event.status_value || event.note || event.event_type);
  }

  if (kind === "level") {
  if (eventType === "promotion") return `升上 ${displayValue(event.to_level)}`;
  if (eventType === "recall") return `召回 ${displayValue(event.to_level)}`;
  if (eventType === "option") return `下放 ${displayValue(event.to_level)}`;
  if (eventType === "assign") return `指派 ${displayValue(event.to_level)}`;

  return displayValue(event.to_level || event.note || event.event_type);
}

  if (kind === "team") {
    return displayValue(
      event.to_team ||
        event.team_name ||
        event.team ||
        event.note ||
        event.event_type
    );
  }

  if (kind === "league") {
    return displayValue(event.to_league || event.league || event.note || event.event_type);
  }

  return displayValue(event.note || event.event_type);
}

export default async function PlayerEventsPage({
  params,
  searchParams,
}: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const id = decodeURIComponent(routeParams.id || "");
  const title = "球員歷史紀錄";

  const players = (await getPlayers()) as any[];
  const events = (await getPlayerEvents()) as any[];
  const playerNameOptions = getPlayerNameOptions(players as any);

  const player = players.find((p: any) => {
    return (
      String(p.id) === id ||
      String(p.name_zh) === id ||
      String(p.name_en) === id
    );
  }) as any;

  if (!player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
        <section className="w-full max-w-5xl mx-auto">
          <SiteHeader subtitle="球員事件歷史" showSearch playerNameOptions={playerNameOptions as any} />

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h1 className="text-3xl font-bold">找不到球員</h1>
            <p className="mt-2 text-slate-400">{id}</p>
          </div>
        </section>
      </main>
    );
  }

  const playerEvents = events
    .filter((event: any) => {
      const related = getRelatedPlayer(event);

      const samePlayer =
        String(event.player_id) === String(player.id) ||
        text(event.name_zh) === text(player.name_zh) ||
        text(related?.name_zh) === text(player.name_zh);

      return samePlayer;
    })
    .sort((a: any, b: any) => {
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-8 pb-6">
      <section className="w-full max-w-5xl mx-auto">
        <SiteHeader subtitle="球員事件歷史" showSearch playerNameOptions={playerNameOptions as any} />

        <PlayerPageHeader player={player} showBackLink />

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-800">

            <h2 className="mt-4 text-xl font-bold">{title}</h2>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-4 px-5 py-3 border-b border-slate-800 text-sm text-slate-400">
            <div>日期</div>
            <div>內容</div>
          </div>

          {playerEvents.length === 0 ? (
            <div className="p-5 text-slate-400">目前沒有{title}資料</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {playerEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="grid grid-cols-[120px_1fr] gap-4 p-5 items-center"
                >
                  <div className="text-sm text-slate-400">
                    {displayValue(event.event_date)}
                  </div>

                  <div className="text-lg font-bold text-white">
                    {displayValue(event.note || event.to_team || event.to_level || event.status || event.event_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}