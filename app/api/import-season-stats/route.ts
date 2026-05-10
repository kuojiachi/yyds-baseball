import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.TWDS_API_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ipToOuts(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return 0;

  const [wholeText, decimalText = "0"] = text.split(".");
  const whole = Number(wholeText);
  const decimal = Number(decimalText);

  if (!Number.isFinite(whole)) return 0;

  return whole * 3 + (decimal === 1 ? 1 : decimal === 2 ? 2 : 0);
}

export async function POST(req: Request) {
  const requestApiKey = req.headers.get("x-api-key");

  if (!apiKey || requestApiKey !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rows = Array.isArray(body) ? body : [body];

  const names = Array.from(
    new Set(rows.map((row: any) => row.player_name).filter(Boolean))
  );

  const playerIdMap: Record<string, string> = {};

  if (names.length > 0) {
    const { data: players, error: playerError } = await supabase
      .from("players")
      .select("id, name_zh, name_en")
      .in("name_zh", names);

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    for (const player of players ?? []) {
      playerIdMap[player.name_zh] = player.id;
    }
  }

  const payload = rows.map((row: any) => ({
    player_id: row.player_id || playerIdMap[row.player_name],
    season_year: toNumber(row.season_year || row.Season),
    season_type: row.season_type || "regular",

    league: row.league,
    team_id: row.team_id || null,
    team_name: row.team_name || row.Team,
    level: row.level || row.Level,

    stat_type: row.stat_type,

    g: toNumber(row.g || row.G),
    pa: toNumber(row.pa || row.PA),
    r: toNumber(row.r || row.R),
    h: toNumber(row.h || row.H),
    hr: toNumber(row.hr || row.HR),
    bb: toNumber(row.bb || row.BB),
    ibb: toNumber(row.ibb || row.IBB),
    k: toNumber(row.k || row.SO),
    hbp: toNumber(row.hbp || row.HBP || row.HB),
    go_ao: row.go_ao || row["GO/AO"] || null,
    official_k_rate: row.official_k_rate || row["K%"] || null,
    official_bb_rate: row.official_bb_rate || row["BB%"] || null,
    official_babip: row.official_babip || row.BABIP || null,

    ab: toNumber(row.ab || row.AB),
    tb: toNumber(row.tb || row.TB),
    doubles: toNumber(row.doubles || row["2B"]),
    triples: toNumber(row.triples || row["3B"]),
    rbi: toNumber(row.rbi || row.RBI),
    sb: toNumber(row.sb || row.SB),
    cs: toNumber(row.cs || row.CS),
    sf: toNumber(row.sf || row.SF),

    win: toNumber(row.win || row.W),
    loss: toNumber(row.loss || row.L),
    era: row.era || row.ERA || null,
    gs: toNumber(row.gs || row.GS),
    cg: toNumber(row.cg || row.CG),
    sho: toNumber(row.sho || row.SHO),
    hold: toNumber(row.hold || row.HLD),
    save: toNumber(row.save || row.SV),
    svo: toNumber(row.svo || row.SVO),
    ip_outs: row.ip_outs ?? ipToOuts(row.IP),
    er: toNumber(row.er || row.ER),
    pitch_count: toNumber(row.pitch_count || row.NP),

    official_avg: row.official_avg || row.AVG || null,
    official_obp: row.official_obp || row.OBP || null,
    official_slg: row.official_slg || row.SLG || null,
    official_ops: row.official_ops || row.OPS || null,
    official_whip: row.official_whip || row.WHIP || null,

    source: row.source || null,
    source_url: row.source_url || null,
    synced_at: new Date().toISOString(),
    note: row.note || null,
  }));

  const { data, error } = await supabase
    .from("season_stats")
    .upsert(payload, {
      onConflict:
        "player_id,season_year,season_type,league,level,team_name,stat_type",
    })
    .select();

  if (error) {
    console.error("import-season-stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    count: data?.length ?? 0,
    data,
  });
}