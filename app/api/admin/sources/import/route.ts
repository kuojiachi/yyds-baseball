import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey || apiKey !== process.env.TWDS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const seasonStats = body.seasonStats ?? [];
  const transactions = body.transactions ?? [];
  const dailyReports = body.dailyReports ?? [];

  function parseTransactionDate(text: string) {
    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString().slice(0, 10);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: any = {};

  if (seasonStats.length > 0) {
    const { data, error } = await supabase
      .from("season_stats")
      .upsert(seasonStats, {
        onConflict: "player_id,season_year,team_name,level,stat_type",
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    results.seasonStats = data;
  }

  if (transactions.length > 0) {
    const { data, error } = await supabase
      .from("player_events")
      .upsert(
        transactions.map((row: any) => {
          const { event_date_text, ...cleanRow } = row;

          return {
            ...cleanRow,
            event_date: parseTransactionDate(event_date_text),
          };
        }),
        {
          onConflict: "player_id,event_date,event_type,note",
        }
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    results.transactions = data;
  }

  if (dailyReports.length > 0) {
    const { data, error } = await supabase
      .from("daily_reports")
      .upsert(
        dailyReports.map((row: any) => {
          const {
            target_table,
            report_date_text,
            official_avg,
            official_obp,
            official_slg,
            ...cleanRow
          } = row;

          return {
            ...cleanRow,
            report_date: report_date_text,
            avg: official_avg,
            obp: official_obp,
            slg: official_slg,
            result: "出賽",
            game_type: "regular",
          };
        }),
        {
          onConflict: "game_pk,player_id",
        }
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    results.dailyReports = data;
  }

  return NextResponse.json({
    ok: true,
    results,
  });
}