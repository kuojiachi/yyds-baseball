import { supabase } from "@/src/lib/supabase";

export type SeasonStatType = "batting" | "pitching";
export type SeasonType = "regular" | "postseason";

export async function getPlayerSeasonStats(playerId: string) {
  const { data, error } = await supabase
    .from("season_stats_view")
    .select("*")
    .eq("player_id", playerId)
    .order("season_year", { ascending: false })
    .order("league", { ascending: true })
    .order("level", { ascending: true })
    .order("team_name", { ascending: true });

  if (error) {
    console.error("getPlayerSeasonStats error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPlayerCurrentSeasonStats(
  playerId: string,
  year = new Date().getFullYear()
) {
  const { data, error } = await supabase
    .from("season_stats_view")
    .select("*")
    .eq("player_id", playerId)
    .eq("season_year", year)
    .eq("season_type", "regular")
    .order("league", { ascending: true })
    .order("level", { ascending: true })
    .order("team_name", { ascending: true });

  if (error) {
    console.error("getPlayerCurrentSeasonStats error:", error.message);
    return [];
  }

  return data ?? [];
}