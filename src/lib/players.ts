import { supabase } from './supabase'

export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select(`
      id,
      name_zh,
      name_en,
      league,
      level,
      position,
      bats,
      throws,
      birth_date,
      nationality,
      status,
      note,
      current_team_id,
      teams:current_team_id (
        id,
        code,
        name_zh,
        name_en
      )
    `)
    .order('name_zh', { ascending: true })

  if (error) {
    console.error('getPlayers error:', error.message)
    return []
  }

  return data ?? []
}