import { supabase } from "./supabase";

function pickTeamName(teams: any) {
  const team = Array.isArray(teams) ? teams[0] : teams;
  return team?.name_zh || team?.name_en || team?.code || "-";
}

function pickPlayer(players: any) {
  return Array.isArray(players) ? players[0] : players;
}

export async function getPlayerEvents() {
  const { data, error } = await supabase
    .from("player_events")
    .select(`
      id,
      player_id,
      name_zh,
      event_date,
      event_type,
      from_team,
      to_team,
      from_level,
      to_level,
      league,
      status,
      note,
      created_at,
      players (
        id,
        name_zh,
        name_en,
        league,
        level,
        team_name,
        teams!players_current_team_id_fkey (
        id,
        name_zh,
        name_en,
        code
      )
      )
    `)
    .not("event_type", "is", null)
    .not("event_date", "is", null)
    .order("event_date", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("getPlayerEvents error:", error.message);
    return [];
  }

  return (data || []).map((event: any) => {
    const player = pickPlayer(event.players);

    return {
      ...event,
      name_zh: event.name_zh || player?.name_zh,
      team_name: event.team_name || player?.team_name || pickTeamName(player?.teams),
      level: event.level || player?.level,
      league: event.league || player?.league,
    };
  });
}