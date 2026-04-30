import { supabase } from './supabase'

export async function getDailyReports() {
  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      id,
      report_date,
      result,
      position,
      ab,
      h,
      rbi,
      players (
        name_zh
      )
    `)
    .order('report_date', { ascending: false })
    .limit(20)

  if (error) {
    console.error(error)
    return []
  }

  return data
}