'use client'

import { useState } from 'react'

type Player = {
  id: string
  name_zh: string
  league: string | null
  level: string | null
  position: string | null
}

export default function PlayerSearch({ players }: { players: Player[] }) {
  const [keyword, setKeyword] = useState('')

  const results = players
    .filter((p) => p.name_zh?.includes(keyword))
    .slice(0, 8)

  return (
    <div style={{ margin: '16px 0', maxWidth: 360 }}>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜尋球員"
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: '1px solid #444',
          background: '#111',
          color: '#fff',
        }}
      />

      {keyword && (
        <div style={{ marginTop: 8, border: '1px solid #333', borderRadius: 8 }}>
          {results.map((p) => (
            <a
              key={p.id}
              href={`/players/${p.id}`}
              style={{
                display: 'block',
                padding: 10,
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              {p.name_zh}｜{p.league}｜{p.level}｜{p.position}
              </a>
          ))}
        </div>
      )}
    </div>
  )
}