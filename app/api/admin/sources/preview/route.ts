import { NextResponse } from "next/server";
import { parseSourcePreview } from "@/src/lib/sourceParsers";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey || apiKey !== process.env.TWDS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const preview = await parseSourcePreview({
    playerId: body.player_id,
    playerNameZh: body.player_name_zh,
    playerNameEn: body.player_name_en,
    sourceType: body.source_type,
    sourceInput: body.source_input,
  });

  return NextResponse.json({
    ok: true,
    sourceType: body.source_type,
    preview,
  });
}