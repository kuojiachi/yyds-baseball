import { getPlayers } from '@/src/lib/players'
import { getDailyReports } from '@/src/lib/dailyReports'
import { getPlayerEvents } from '@/src/lib/playerEvents'

export default async function AdminPage() {
  const players = await getPlayers()
  const reports = await getDailyReports()
  const events = await getPlayerEvents()

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h1>TWDS Admin</h1>

      <section style={card}>
        <h2>資料狀態</h2>
        <div>球員：{players.length}</div>
        <div>今日戰報：{reports.length}</div>
        <div>異動：{events.length}</div>
      </section>

      <section style={card}>
        <h2>快速入口</h2>
        <a href="/" style={link}>回首頁</a>
        <a href="/players" style={link}>球員總表</a>
      </section>

      <section style={card}>
        <h2>最近異動</h2>
        {events.map((e: any) => (
          <div key={e.id}>
            {e.event_date}｜{Array.isArray(e.players) ? e.players[0]?.name_zh : e.players?.name_zh}｜{e.event_type || '異動'}
          </div>
        ))}
      </section>
    </main>
  )
}

const card = {
  border: '1px solid #333',
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  background: '#111',
  color: '#fff',
} as const

const link = {
  display: 'block',
  marginTop: 8,
  color: '#60a5fa',
} as const