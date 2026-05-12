import { supabase } from "./supabase";

export async function getDailyReports() {
  const { data, error } = await supabase
    .from("daily_reports")
    .select(`
      id,
      player_id,
      report_date,
      team_name,
      league,
      level,
      position,
      result,
      game_type,
      opponent,
      stat_type,
      stats,
      ab,
      pa,
      r,
      h,
      tb,
      rbi,
      bb,
      ibb,
      k,
      hr,
      doubles,
      triples,
      sb,
      cs,
      hbp,
      sf,
      ip,
      er,
      bf,
      pitch_count,
      win,
      loss,
      w,
      l,
      g,
      gs,
      cg,
      sho,
      sv,
      svo,
      np_s,
      avg,
      obp,
      slg,
      era,
      whip,
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
    .limit(1000);

  if (error) {
    console.error("getDailyReports error:", error.message);
    return [];
  }

  return data ?? [];
}