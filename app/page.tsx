import { getPlayers } from '@/src/lib/players'
import { getPlayerEvents } from '@/src/lib/playerEvents'
import { getDailyReports } from '@/src/lib/dailyReports'
import PlayerSearch from '@/src/components/PlayerSearch'

export default async function Home() {
  const players = await getPlayers()
  const events = await getPlayerEvents()
  const reports = await getDailyReports()

  const total = players.length
  const moved = events.length
  const todayCount = reports.length
  const mlb = players.filter((p) => p.league === 'MLB' || p.league === 'MiLB').length
  const npb = players.filter((p) => p.league === 'NPB').length
  const kbo = players.filter((p) => p.league === 'KBO').length

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>TWDS｜旅外就是神</h1>

      <PlayerSearch players={players} />
      
      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div style={cardStyle}>
          <strong>旅外含台裔球員總數</strong>
          <div style={numStyle}>{total}</div>
        </div>

        <div style={cardStyle}>
          <strong>今日戰報</strong>
          <div style={numStyle}>{todayCount}</div>
        </div>

        <div style={cardStyle}>
          <strong>異動</strong>
          <div style={numStyle}>{moved}</div>
        </div>

        <div style={cardStyle}>
          <strong>美日韓職</strong>
          <div>美職 {mlb}｜日職 {npb}｜韓職 {kbo}</div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>最新異動</h2>
        {events.map((e: any) => (
          <div key={e.id}>
            {e.event_date}｜{Array.isArray(e.players) ? e.players[0]?.name_zh : e.players?.name_zh}｜{e.event_type || '異動'}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>今日戰報</h2>
        {reports.map((r: any) => (
          <div key={r.id}>
            {r.report_date}｜{Array.isArray(r.players) ? r.players[0]?.name_zh : r.players?.name_zh}｜{r.position}｜{r.result || '-'}｜{r.ab ?? 0}-{r.h ?? 0}-{r.rbi ?? 0}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>旅外球員總表</h2>
        {players.map((p) => (
          <div key={p.id}>
            <strong>{p.name_zh}</strong> - {p.league} - {p.level} - {p.position}
          </div>
        ))}
      </section>
    </main>
  )
}

const cardStyle = {
  border: '1px solid #333',
  borderRadius: 12,
  padding: 16,
  background: '#111',
  color: '#fff',
}

const numStyle = {
  fontSize: 28,
  fontWeight: 700,
  marginTop: 8,
  color: '#4ade80', // 綠色
}