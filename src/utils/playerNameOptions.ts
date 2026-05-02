type PlayerNameSource = {
  id?: string | number | null;
  name_zh?: string | null;
  name_en?: string | null;
  name?: string | null;
};

export function getPlayerNameOptions(players: PlayerNameSource[]) {
  return players.map((player) => ({
    id: String(player.id ?? ""),
    name_zh: String(player.name_zh ?? player.name ?? ""),
    name_en: String(player.name_en ?? ""),
  }));
}