import { supabase } from "@/src/lib/supabase";

export type PlayerScoutingReport = {
  id: string;
  player_id: string;
  source: string;
  source_url: string | null;
  source_team: string | null;
  source_list: string | null;
  source_rank: number | null;
  report_year: number | null;

  hit: number | null;
  power: number | null;
  run: number | null;
  arm: number | null;
  field: number | null;

  fastball: number | null;
  slider: number | null;
  curveball: number | null;
  breaking: number | null;
  changeup: number | null;
  command: number | null;
  control: number | null;
  stuff: number | null;

  overall: number | null;
  fv: string | null;
  summary: string | null;
};

export async function getPlayerScoutingReports(playerId: string) {
  const { data, error } = await supabase
    .from("player_scouting_reports")
    .select("*")
    .eq("player_id", playerId)
    .order("report_year", { ascending: false })
    .order("source_rank", { ascending: true });

  if (error) {
    console.error("getPlayerScoutingReports error:", error.message);
    return [];
  }

  return (data ?? []) as PlayerScoutingReport[];
}