import { supabase } from '@/src/lib/supabase'

export default async function PlayerPage({
  params,
}: {
  params: { id: string }
}) {
  const { data } = await supabase

    .from('players')
    .select(`
      id,
      name_zh,
      name_en,
      league,
      level,
      position,
      status,
      note,
      teams (
        name_zh,
        name_en
      )
    `)
    .eq('id', params.id)
    .single()
    
  const player: any = data    

  if (!player) {
    return <main style={{ padding: 20 }}>找不到球員</main>
  }

  return (
    <main style={{ padding: 20 }}>
      <a href="/">← 回首頁</a>

      <h1>{player.name_zh}</h1>

      <div>英文名：{player.name_en || '-'}</div>
      <div>球隊：{Array.isArray(player.teams) ? player.teams[0]?.name_zh : player.teams?.name_zh}</div>
      <div>聯盟：{player.league}</div>
      <div>層級：{player.level}</div>
      <div>守位：{player.position}</div>
      <div>狀態：{player.status || '-'}</div>
      <div>備註：{player.note || '-'}</div>
    </main>
  )
}