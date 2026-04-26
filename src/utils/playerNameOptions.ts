import type { Player } from "@/src/lib/excel";

export function getPlayerNameOptions(players: Player[]) {
  return Array.from(
    new Set(
      players
        .map((player) => String(player.name || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}