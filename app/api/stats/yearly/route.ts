import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const player_id = searchParams.get("player_id");
  const year = searchParams.get("year");

  if (!player_id || !year) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("player_id", player_id)
    .gte("report_date", start)
    .lte("report_date", end);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 🔥 開始統計
  const stats = {
    games: data.length,

    ab: 0,
    r: 0,
    h: 0,
    rbi: 0,
    bb: 0,
    so: 0,
    hr: 0,
    doubles: 0,
    triples: 0,
    sb: 0,

    ip_outs: 0,
    er: 0,
    bb_allowed: 0,
    k: 0,
    pitch_count: 0,
  };

  for (const row of data) {
    stats.ab += row.ab || 0;
    stats.r += row.r || 0;
    stats.h += row.h || 0;
    stats.rbi += row.rbi || 0;
    stats.bb += row.bb || 0;
    stats.so += row.so || 0;
    stats.hr += row.hr || 0;
    stats.doubles += row.doubles || 0;
    stats.triples += row.triples || 0;
    stats.sb += row.sb || 0;

    // ⚾ IP 轉 outs（0.1=1 out）
    if (row.ip) {
      const whole = Math.floor(row.ip);
      const decimal = row.ip - whole;

      const outs =
        whole * 3 +
        (decimal === 0.1 ? 1 : decimal === 0.2 ? 2 : 0);

      stats.ip_outs += outs;
    }

    stats.er += row.er || 0;
    stats.bb_allowed += row.bb_allowed || 0;
    stats.k += row.k || 0;
    stats.pitch_count += row.pitch_count || 0;
  }

  return NextResponse.json(stats);
}