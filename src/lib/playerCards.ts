import { supabase } from './supabase'

function text(v: unknown) {
  return String(v ?? '').trim()
}

function isThisYear(dateText: string) {
  const d = new Date(dateText)
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
}

function isWithinDays(dateText: string, days: number) {
  const d = new Date(dateText)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

export async function getPlayerCards(playerId: string) {
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select(`
      id,
      name_zh,
      league,
      level,
      status,
      position,
      current_team_id,
      teams (
        id,
        name_zh,
        name_en,
        code
      )
    `)
    .eq('id', playerId)
    .single()

  if (playerError) {
    console.error('getPlayerCards player error:', playerError)
    return null
  }

  const { data: events, error: eventsError } = await supabase
    .from('player_events')
    .select(`
      id,
      event_date,
      event_type,
      to_level,
      note
    `)
    .eq('player_id', playerId)
    .order('event_date', { ascending: false })

  if (eventsError) {
    console.error('getPlayerCards events error:', eventsError)
  }

  const { data: reports, error: reportsError } = await supabase
    .from('daily_reports')
    .select(`
      id,
      report_date,
      result,
      ab,
      ip
    `)
    .eq('player_id', playerId)
    .order('report_date', { ascending: false })

  if (reportsError) {
    console.error('getPlayerCards reports error:', reportsError)
  }

  const latestMovement = (events ?? []).find((event) => {
    return (
      isWithinDays(event.event_date, 7) &&
      ['promotion', 'demotion'].includes(event.event_type)
    )
  })

  let movementText = '近一周無升降'

  if (latestMovement?.event_type === 'promotion') {
    movementText = `近一周 ↑ 升${text(latestMovement.to_level) || '-'}`
  }

  if (latestMovement?.event_type === 'demotion') {
    movementText = `近一周 ↓ 降${text(latestMovement.to_level) || '-'}`
  }

  const thisYearReports = (reports ?? []).filter((report) => {
    if (!report.report_date || !isThisYear(report.report_date)) return false

    const hasBatting =
      Number(report.ab ?? 0) > 0 ||
      text(report.result)

    const hasPitching =
      text(report.ip) !== '' ||
      text(report.result)

    return hasBatting || hasPitching
  })

  const team = Array.isArray(player.teams) ? player.teams[0] : player.teams

  return {
    status: text(player.status) || '現役',
    level: text(player.level) || '-',
    movement: movementText,
    team: text(team?.code) || text(team?.name_zh) || '-',
    league: text(player.league) || '-',
    appearances: thisYearReports.length,
  }
}