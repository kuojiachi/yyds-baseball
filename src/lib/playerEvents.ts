import { supabase } from './supabase'

export async function getPlayerEvents() {
  const { data, error } = await supabase
    .from('player_events')
    .select(`
      id,
      event_date,
      event_type,
      note,
      players (
        name_zh
      )
    `)
    .order('event_date', { ascending: false })
    .limit(10)

  if (error) {
    console.error(error)
    return []
  }

  return data
}