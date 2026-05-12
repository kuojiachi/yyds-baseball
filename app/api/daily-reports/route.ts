import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

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
  const rows = Array.isArray(body) ? body : [body];

  const payload = rows.map((row: any) => ({
    player_id: row.player_id,
    report_date: row.report_date,

    team_name: row.team_name || row.team || null,
    league: row.league || null,
    level: row.level || null,
    position: row.position || "DH",
    result: row.result || "出賽",
    game_type: row.game_type || "regular",
    stat_type: row.stat_type || (row.position === "投手" ? "pitching" : "batting"),
    opponent: row.opponent || null,

    ab: toNumberOrNull(row.ab),
    pa: toNumberOrNull(row.pa),
    r: toNumberOrNull(row.r),
    h: toNumberOrNull(row.h),
    tb: toNumberOrNull(row.tb),
    rbi: toNumberOrNull(row.rbi),
    bb: toNumberOrNull(row.bb),
    ibb: toNumberOrNull(row.ibb),
    k: toNumberOrNull(row.k),
    hr: toNumberOrNull(row.hr),
    doubles: toNumberOrNull(row.doubles),
    triples: toNumberOrNull(row.triples),
    sb: toNumberOrNull(row.sb),
    cs: toNumberOrNull(row.cs),
    hbp: toNumberOrNull(row.hbp),
    sf: toNumberOrNull(row.sf),

    ip: row.ip || null,
    er: toNumberOrNull(row.er),
    bf: toNumberOrNull(row.bf),
    pitch_count: toNumberOrNull(row.pitch_count),
    w: toNumberOrNull(row.w ?? row.win),
    l: toNumberOrNull(row.l ?? row.loss),
    g: toNumberOrNull(row.g),
    gs: toNumberOrNull(row.gs),
    cg: toNumberOrNull(row.cg),
    sho: toNumberOrNull(row.sho),
    sv: toNumberOrNull(row.sv ?? row.save),
    svo: toNumberOrNull(row.svo),
    np_s: row.np_s || row.nps || null,

    avg: row.avg || null,
    obp: row.obp || null,
    slg: row.slg || null,
    era: row.era || null,
    whip: row.whip || null,

  }));

  const { data, error } = await supabase
    .from("daily_reports")
    .upsert(payload, {
      onConflict: "player_id,report_date,opponent",
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    count: data?.length ?? 0,
    data,
  });
}