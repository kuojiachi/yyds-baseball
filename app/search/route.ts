import { NextResponse } from "next/server";
import { getPlayers } from "@/src/lib/players";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const q = normalizeText(searchParams.get("q"));

  if (!q) {
    return NextResponse.redirect(`${origin}/players`);
  }

  const players = await getPlayers();

  const exactMatch = players.find((player: any) => {
    return (
      normalizeText(player.name_zh) === q ||
      normalizeText(player.name_en) === q ||
      normalizeText(player.id) === q
    );
  });

  if (exactMatch) {
    return NextResponse.redirect(`${origin}/players/${encodeURIComponent(exactMatch.id)}`);
  }

  return NextResponse.redirect(`${origin}/players?q=${encodeURIComponent(q)}`);
}