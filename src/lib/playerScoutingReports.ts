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
  raw_power: number | null;
  game_power: number | null;
  run: number | null;
  arm: number | null;
  field: number | null;

  fastball: number | null;
  slider: number | null;
  curveball: number | null;
  breaking: number | null;
  changeup: number | null;
  cutter: number | null;
  splitter: number | null;
  command: number | null;
  control: number | null;
  stuff: number | null;

  overall: number | null;
  fv: string | null;
  summary: string | null;

  eta: number | null;

  hit_future: number | null;
  power_future: number | null;
  game_power_future: number | null;
  raw_power_future: number | null;
  run_future: number | null;
  arm_future: number | null;
  field_future: number | null;

  fastball_future: number | null;
  breaking_future: number | null;
  changeup_future: number | null;
  slider_future: number | null;
  curveball_future: number | null;
  cutter_future: number | null;
  splitter_future: number | null;
  command_future: number | null;
  control_future: number | null;
  stuff_future: number | null;
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