type SortablePlayer = {
  league?: string | number | null;
  level?: string | number | null;
  team?: string | number | null;
  name?: string | number | null;
  player?: string | number | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getLevelRank(levelValue: unknown): number {
  const level = normalizeText(levelValue);

  const rankMap: Record<string, number> = {
    MLB: 1,
    "3A": 2,
    AAA: 2,
    "2A": 3,
    AA: 3,
    "A+": 4,
    "High-A": 4,
    "1A": 5,
    A: 5,
    RK: 6,
    Rookie: 6,
    日職一軍: 7,
    日職二軍: 8,
    育成: 9,
    韓職一軍: 10,
    韓職二軍: 11,
  };

  return rankMap[level] ?? 99;
}

function getLeagueRank(leagueValue: unknown): number {
  const league = normalizeText(leagueValue);

  if (
    league === "旅美" ||
    league === "美職" ||
    league === "MLB" ||
    league === "MiLB"
  ) {
    return 1;
  }

  if (league === "旅日" || league === "日職" || league === "NPB") {
    return 2;
  }

  if (league === "旅韓" || league === "韓職" || league === "KBO") {
    return 3;
  }

  if (league === "台裔") {
    return 9;
  }

  return 8;
}

export function sortPlayersForTable<T extends SortablePlayer>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const levelCompare = getLevelRank(a.level) - getLevelRank(b.level);

    if (levelCompare !== 0) return levelCompare;

    const leagueCompare = getLeagueRank(a.league) - getLeagueRank(b.league);

    if (leagueCompare !== 0) return leagueCompare;

    const teamCompare = normalizeText(a.team).localeCompare(
      normalizeText(b.team),
      "zh-Hant"
    );

    if (teamCompare !== 0) return teamCompare;

    return normalizeText(a.name || a.player).localeCompare(
      normalizeText(b.name || b.player),
      "zh-Hant"
    );
  });
}