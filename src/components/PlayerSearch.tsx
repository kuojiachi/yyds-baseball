'use client'

import { useState } from 'react'

type Player = {
  id: string
  name_zh: string
  name_en?: string | null
  league?: string | null
  level?: string | null
  position?: string | null
}

export default function PlayerSearch({ players }: { players: Player[] }) {
  const [keyword, setKeyword] = useState('')

  const k = keyword.toLowerCase()

  const results = players
    .map((p) => {
      const zh = (p.name_zh || '').toLowerCase()
      const en = (p.name_en || '').toLowerCase()

      let score = 0

      // 中文完全符合
      if (zh.includes(k)) score += 3

      // 英文包含
      if (en.includes(k)) score += 2

      // 英文開頭（Chen）
      if (en.startsWith(k)) score += 2

      // 拼音弱匹配（簡單版）
      if (k && zh.includes(keyword)) score += 1

      return { ...p, score }
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  return (
    <div style={{ margin: '16px 0', maxWidth: 360 }}>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜尋球員（中文 / 英文）"
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
              href={p.id ? `/players/${p.id}` : "#"}
              style={{
                display: 'block',
                padding: 10,
                color: '#fff',
                textDecoration: 'none',
                borderBottom: '1px solid #222',
              }}
            >
              <div>{p.name_zh}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                {p.name_en}｜{p.league}｜{p.level}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}