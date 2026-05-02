import { supabase } from "./supabase";

export async function getPlayerEvents() {
  const { data, error } = await supabase
    .from("player_events")
    .select(`
      id,
      name_zh,
      event_date,
      event_type,
      from_team,
      to_team,
      from_level,
      to_level,
      league,
      note,
      created_at
    `)
    .not("event_type", "is", null)
    .not("event_date", "is", null)
    .order("event_date", { ascending: false })
    .limit(20);

  if (error) {
    console.error("getPlayerEvents error:", error.message);
    return [];
  }

  return data || [];
}