import { supabase } from "@/src/lib/supabase";

export async function getPlayerSeasonStatsSummary(playerId: string) {
  const { data, error } = await supabase
    .from("season_stats_summary")
    .select("*")
    .eq("player_id", playerId)
    .order("season_year", { ascending: false, nullsFirst: false })
    .order("season_label", { ascending: false });

  if (error) {
    console.error("getPlayerSeasonStatsSummary error:", error.message);
    return [];
  }

  return data ?? [];
}