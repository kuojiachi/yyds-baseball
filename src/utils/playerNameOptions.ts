import type { Player } from "@/src/lib/excel";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function getPlayerNameOptions(players: Player[]): string[] {
  return Array.from(
    new Set(players.map((player) => normalizeText(player.name)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}