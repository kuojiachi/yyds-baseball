import { supabase } from './supabase'

export async function getDailyReports() {
  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      id,
      player_id,
      report_date,
      position,
      result,
      ab,
      r,
      h,
      rbi,
      bb,
      hr,
      doubles,
      triples,
      sb,
      ip,
      er,
      k,
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
    .order('report_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('getDailyReports error:', error.message)
    return []
  }

  return data ?? []
}