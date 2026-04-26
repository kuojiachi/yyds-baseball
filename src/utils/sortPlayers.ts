type SortablePlayer = {
  league?: string | number | null;
  level?: string | number | null;
  team?: string | number | null;
  name?: string | number | null;
  player?: string | number | null;
  status?: string | number | null;
  note?: string | number | null;
  movement?: string | number | null;
  identity?: string | number | null;
  [key: string]: unknown;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function getLevelRank(levelValue: unknown) {
  const level = text(levelValue);

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

function getLeagueRank(leagueValue: unknown) {
  const league = text(leagueValue);

  if (league === "旅美" || league === "美職" || league === "MLB" || league === "MiLB") return 1;
  if (league === "旅日" || league === "日職" || league === "NPB") return 2;
  if (league === "旅韓" || league === "韓職" || league === "KBO") return 3;
  if (league === "台裔") return 9;

  return 8;
}

export function sortPlayersForTable(players: SortablePlayer[]) {
  return [...players].sort((a, b) => {

    const aLevelRank = getLevelRank(a.level);
    const bLevelRank = getLevelRank(b.level);

    if (aLevelRank !== bLevelRank) {
      return aLevelRank - bLevelRank;
    }

    const aLeagueRank = getLeagueRank(a.league);
    const bLeagueRank = getLeagueRank(b.league);

    if (aLeagueRank !== bLeagueRank) {
      return aLeagueRank - bLeagueRank;
    }

    const teamCompare = text(a.team).localeCompare(text(b.team), "zh-Hant");
    if (teamCompare !== 0) return teamCompare;

    return text(a.name || a.player).localeCompare(text(b.name || b.player), "zh-Hant");
  });
}