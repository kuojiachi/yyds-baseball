import { supabase } from './supabase'

export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select(`
      id,
      name_zh,
      league,
      level,
      position,
      status,
      note
    `)
    .order('level', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return data
}