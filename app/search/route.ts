import { NextResponse } from "next/server";

import { getPlayersFromExcel } from "@/src/lib/excel";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const q = normalizeText(searchParams.get("q"));

  if (!q) {
    return NextResponse.redirect(`${origin}/players`);
  }

  const players = await getPlayersFromExcel();

  const exactMatch = players.find((player) => {
    return normalizeText(player.name) === q;
  });

  if (exactMatch) {
    return NextResponse.redirect(
      `${origin}/players/${encodeURIComponent(exactMatch.name)}`
    );
  }

  return NextResponse.redirect(`${origin}/players?q=${encodeURIComponent(q)}`);
}