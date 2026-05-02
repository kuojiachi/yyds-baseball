import { supabase } from "./supabase";

export async function getPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select(`
      id,
      name_zh,
      name_en,
      league,
      level,
      position,
      status,
      note,
      team_name,
      current_team_id,
      teams:current_team_id (
        id,
        name_zh,
        name_en,
        league
      )
    `)
    .order("level", { ascending: true });

  if (error) {
    console.error('getPlayers error:', error)
    throw error
  }
  return data || [];
}