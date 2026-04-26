  type SortablePlayer = {
    league?: string | number | null;
    level?: string | number | null;
    team?: string | number | null;
    name?: string | number | null;
    player?: string | number | null;
    status?: string | number | null;
    movement?: string | number | null;
    [key: string]: unknown;
  };

export function sortPlayers(players: SortablePlayer[]) {

  const typeOrder = {
    投手: 1,
    野手: 2,
  };

  const leagueOrder = {
    MLB: 1,
    MiLB: 1,
    NPB: 2,
    KBO: 3,
    其他: 4,
  };

  const levelOrder = {
    MLB: 1,
    "3A": 2,
    "2A": 3,
    "High-A": 4,
    "A+": 4,
    A: 5,
    "1A": 5,
    Rookie: 6,
    RK: 6,
    日職一軍: 7,
    一軍: 7,
    日職二軍: 8,
    韓職一軍: 9,
  };

  return [...players].sort((a, b) => {
    const aMovement = String(a.movement ?? "");
    const bMovement = String(b.movement ?? "");

    const aHasMovement = aMovement.trim() !== "";
    const bHasMovement = bMovement.trim() !== "";

    if (aHasMovement && !bHasMovement) return -1;
    if (!aHasMovement && bHasMovement) return 1;

    const aIdentity = String(a.identity ?? "");
    const bIdentity = String(b.identity ?? "");
    const aNote = String(a.note ?? "");
    const bNote = String(b.note ?? "");
    const aName = String(a.name ?? "");
    const bName = String(b.name ?? "");

    const aIsTaiwaneseDescent =
      aIdentity === "台裔" || aNote === "台裔" || aName.includes("台裔");

    const bIsTaiwaneseDescent =
      bIdentity === "台裔" || bNote === "台裔" || bName.includes("台裔");

    if (!aIsTaiwaneseDescent && bIsTaiwaneseDescent) return -1;
    if (aIsTaiwaneseDescent && !bIsTaiwaneseDescent) return 1;

    const typeDiff =
      typeOrder[a.type as keyof typeof typeOrder] -
      typeOrder[b.type as keyof typeof typeOrder];

    if (typeDiff !== 0) return typeDiff;

    const leagueDiff =
      (leagueOrder[a.league as keyof typeof leagueOrder] ?? 99) -
      (leagueOrder[b.league as keyof typeof leagueOrder] ?? 99);

    if (leagueDiff !== 0) return leagueDiff;

    const levelDiff =
      (levelOrder[a.level as keyof typeof levelOrder] ?? 99) -
      (levelOrder[b.level as keyof typeof levelOrder] ?? 99);

    if (levelDiff !== 0) return levelDiff;

    return String(a.name).localeCompare(String(b.name), "zh-Hant");
  });
}
export function sortPlayersForTable(players: SortablePlayer[]) {
  const typeOrder = {
    投手: 1,
    野手: 2,
  };

  const leagueOrder = {
    MLB: 1,
    NPB: 2,
    KBO: 3,
    其他: 4,
  };

  const levelOrder = {
    MLB: 1,
    "3A": 2,
    "2A": 3,
    "High-A": 4,
    A: 5,
    Rookie: 6,
  };

  return [...players].sort((a, b) => {
    
    const aIdentity = String(a.identity ?? "");
    const bIdentity = String(b.identity ?? "");
    const aNote = String(a.note ?? "");
    const bNote = String(b.note ?? "");
    const aName = String(a.name ?? "");
    const bName = String(b.name ?? "");

    const aIsTaiwaneseDescent =
      aIdentity === "台裔" || aNote === "台裔" || aName.includes("台裔");

    const bIsTaiwaneseDescent =
      bIdentity === "台裔" || bNote === "台裔" || bName.includes("台裔");

    if (!aIsTaiwaneseDescent && bIsTaiwaneseDescent) return -1;
    if (aIsTaiwaneseDescent && !bIsTaiwaneseDescent) return 1;

    const typeDiff =
      typeOrder[a.type as keyof typeof typeOrder] -
      typeOrder[b.type as keyof typeof typeOrder];

    if (typeDiff !== 0) return typeDiff;

    const leagueDiff =
      leagueOrder[a.league as keyof typeof leagueOrder] -
      leagueOrder[b.league as keyof typeof leagueOrder];

    if (leagueDiff !== 0) return leagueDiff;

    return (
      levelOrder[a.level as keyof typeof levelOrder] -
      levelOrder[b.level as keyof typeof levelOrder]
    );
  });
}