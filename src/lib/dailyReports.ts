import { supabase } from "./supabase";

export async function getDailyReports() {
  const { data, error } = await supabase
    .from("daily_reports")
    .select(`
      id,
      player_id,
      report_date,
      league,
      level,
      position,
      result,
      game_type,
      opponent,
      stats,
      ab,
      pa,
      r,
      h,
      rbi,
      bb,
      k,
      hr,
      doubles,
      triples,
      sb,
      hbp,
      sf,
      ip,
      er,
      bf,
      pitch_count,
      players (
        id,
        name_zh,
        name_en,
        league,
        level,
        team_name,
        teams:current_team_id (
          id,
          name_zh,
          name_en
        )
      )
    `)
    .order("report_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getDailyReports error:", error.message);
    return [];
  }

  return data ?? [];
}