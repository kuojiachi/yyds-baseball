import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey || apiKey !== process.env.TWDS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();

  const payload = {
    player_id: body.player_id,
    report_date: body.report_date,
    league: body.league,
    level: body.level,
    position: body.position,
    result: body.result,
    game_type: body.game_type,
    opponent: body.opponent,

    ab: body.ab,
    pa: body.pa,
    r: body.r,
    h: body.h,
    rbi: body.rbi,
    bb: body.bb,
    k: body.k,
    hr: body.hr,
    doubles: body.doubles,
    triples: body.triples,
    sb: body.sb,
    hbp: body.hbp,
    sf: body.sf,

    ip: body.ip,
    er: body.er,
    bf: body.bf,
    pitch_count: body.pitch_count,
  };

  const { data, error } = await supabase
    .from("daily_reports")
    .insert(payload)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    data,
  });
}