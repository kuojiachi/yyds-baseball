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

  const stats = {
    games: data.length,

    ab: 0,
    r: 0,
    h: 0,
    rbi: 0,
    bb: 0,
    k: 0,
    hr: 0,
    doubles: 0,
    triples: 0,
    sb: 0,
    hbp: 0,
    sf: 0,

    ip_outs: 0,
    er: 0,
    bf: 0,
    pitch_count: 0,
  };

  for (const row of data) {
    stats.ab += row.ab || 0;
    stats.r += row.r || 0;
    stats.h += row.h || 0;
    stats.rbi += row.rbi || 0;
    stats.bb += row.bb || 0;
    stats.k += row.k || 0;
    stats.hr += row.hr || 0;
    stats.doubles += row.doubles || 0;
    stats.triples += row.triples || 0;
    stats.sb += row.sb || 0;
    stats.hbp += row.hbp || 0;
    stats.sf += row.sf || 0;

    stats.er += row.er || 0;
    stats.bf += row.bf || 0;
    stats.pitch_count += row.pitch_count || 0;

    if (row.ip) {
      stats.ip_outs += ipToOuts(row.ip);
    }
  }

  return NextResponse.json({
    ...stats,
    ip: outsToIp(stats.ip_outs),
  });
}

function ipToOuts(ipValue: unknown): number {
  const text = String(ipValue ?? "").trim();

  if (!text) return 0;

  const [wholeText, decimalText = "0"] = text.split(".");
  const whole = Number(wholeText);
  const decimal = Number(decimalText);

  if (!Number.isFinite(whole)) return 0;

  return whole * 3 + (decimal === 1 ? 1 : decimal === 2 ? 2 : 0);
}

function outsToIp(outs: number): string {
  const innings = Math.floor(outs / 3);
  const remainder = outs % 3;

  if (remainder === 0) return `${innings}.0`;
  return `${innings}.${remainder}`;
}