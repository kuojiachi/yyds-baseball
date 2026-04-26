import { NextResponse } from "next/server";
import { getPlayersFromExcel } from "@/src/lib/excel";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.redirect(`${origin}/players`);
  }

  const players = await getPlayersFromExcel();

  const exactMatch = players.find((player) => player.name === q);

  if (exactMatch) {
    return NextResponse.redirect(
      `${origin}/players/${encodeURIComponent(exactMatch.name)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/players?q=${encodeURIComponent(q)}`
  );
}