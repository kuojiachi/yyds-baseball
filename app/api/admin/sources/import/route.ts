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

  function ipToOuts(ipValue: unknown) {
    const value = String(ipValue ?? "").trim();

    if (!value) return 0;

    // KBO may return IP as "49 1/3" or "6 1/3".
    const spacedFractionMatch = value.match(/^(\d+)\s+([12])\/3$/);
    if (spacedFractionMatch) {
      return Number(spacedFractionMatch[1]) * 3 + Number(spacedFractionMatch[2]);
    }

    const compactFractionMatch = value.match(/^(\d+)([12])\/3$/);
    if (compactFractionMatch) {
      return Number(compactFractionMatch[1]) * 3 + Number(compactFractionMatch[2]);
    }

    const [wholeText, decimalText = "0"] = value.split(".");
    const whole = Number(wholeText);
    const decimal = Number(decimalText);

    if (!Number.isFinite(whole)) return 0;

    return whole * 3 + (decimal === 1 ? 1 : decimal === 2 ? 2 : 0);
  }



  function ipToDisplayDecimal(ipValue: unknown) {
    const value = String(ipValue ?? "").trim();

    if (!value) return null;

    const fractionMatch = value.match(/^(\d+)\s+([12])\/3$/);
    if (fractionMatch) {
      return `${fractionMatch[1]}.${fractionMatch[2]}`;
    }

    const [wholeText, decimalText = "0"] = value.split(".");
    const whole = Number(wholeText);
    const decimal = Number(decimalText);

    if (!Number.isFinite(whole)) return null;
    if (decimal !== 1 && decimal !== 2) return whole;

    return Number(`${whole}.${decimal}`);
  }

  function cleanValue(value: any) {
    if (value === "-" || value === "" || value === undefined) return null;
    return value;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: any = {};

  if (seasonStats.length > 0) {
    const seasonStatsRows = seasonStats.map((row: any) => {
      const {
        target_table,
        ip,
        whip,
        avg,
        avgAgainst,
        avg_against,
        k9,
        bb9,
        hr9,
        h9,
        kbb,
        official_avg,
        official_obp,
        official_slg,
        official_ops,
        official_whip,
        ...cleanRow
      } = row;

      const normalizedRow = Object.fromEntries(
        Object.entries(cleanRow).map(([key, value]) => [key, cleanValue(value)])
      );

      const integerFields = [
        "season_year", "g", "gs", "cg", "sho",
        "win", "loss", "hold", "save", "svo",
        "bf", "h", "r", "er", "hr",
        "pitch_count", "hbp", "bb", "ibb", "k",
        "pa", "ab", "tb", "doubles", "triples",
        "rbi", "sb", "cs", "sf",
      ];

      for (const key of integerFields) {
        if (normalizedRow[key] !== null && normalizedRow[key] !== undefined) {
          const n = Number(normalizedRow[key]);

          normalizedRow[key] = Number.isInteger(n) ? n : null;
        }
      }

      delete normalizedRow.avg;
      delete normalizedRow.avgAgainst;
      delete normalizedRow.avg_against;

      return {
        ...normalizedRow,
        official_avg: normalizedRow.official_avg ?? official_avg ?? avg ?? avgAgainst ?? avg_against ?? null,
        official_obp: normalizedRow.official_obp ?? official_obp ?? null,
        official_slg: normalizedRow.official_slg ?? official_slg ?? null,
        official_ops: normalizedRow.official_ops ?? official_ops ?? null,
        official_whip: normalizedRow.official_whip ?? official_whip ?? whip ?? null,
        ip_outs: normalizedRow.ip_outs ?? (ip ? ipToOuts(ip) : null),
      };
    });

    const dedupedSeasonStatsRows = Array.from(
      new Map(
        seasonStatsRows.map((row: any) => {
          const key = [
            row.player_id,
            row.season_year,
            row.team_name,
            row.level,
            row.stat_type,
          ].join("|");

          return [key, row];
        })
      ).values()
    );

    const { data, error } = await supabase
      .from("season_stats")
      .upsert(dedupedSeasonStatsRows, {
        onConflict: "player_id,season_year,team_name,level,stat_type",
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    results.seasonStats = data;
  }

  if (transactions.length > 0) {
    const cleanedTransactions = transactions.map((row: any) => {
      const { target_table, event_date_text, ...cleanRow } = row;

      return {
        ...cleanRow,
        event_date: parseTransactionDate(event_date_text ?? cleanRow.event_date),
      };
    });

    const dedupedTransactions = Array.from(
      new Map(
        cleanedTransactions.map((row: any) => {
          const key = [row.player_id, row.event_date, row.event_type, row.note].join("|");
          return [key, row];
        })
      ).values()
    );

    const { data, error } = await supabase
      .from("player_events")
      .upsert(dedupedTransactions, {
        onConflict: "player_id,event_date,event_type,note",
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    results.transactions = data;
  }

  if (dailyReports.length > 0) {
    const dailyReportRows = dailyReports.map((row: any) => {
      const {
        target_table,
        report_date_text,
        official_avg,
        official_obp,
        official_slg,
        official_ops,
        win,
        loss,
        save,
        hold,
        ...cleanRow
      } = row;

      const normalizedRow = Object.fromEntries(
        Object.entries(cleanRow).map(([key, value]) => [key, cleanValue(value)])
      );

      const rawIp = normalizedRow.ip;

      normalizedRow.ip_outs =
        normalizedRow.ip_outs ??
        (rawIp ? ipToOuts(rawIp) : null);

      normalizedRow.ip = rawIp ? ipToDisplayDecimal(rawIp) : null;

      return {
        ...normalizedRow,
        report_date: report_date_text ?? cleanRow.report_date ?? null,
        avg: normalizedRow.avg ?? official_avg ?? null,
        obp: normalizedRow.obp ?? official_obp ?? null,
        slg: normalizedRow.slg ?? official_slg ?? null,
        ops: normalizedRow.ops ?? official_ops ?? null,
        whip: normalizedRow.whip ?? null,
        np_s:
          normalizedRow.np_s ??
          (normalizedRow.pitch_count && normalizedRow.strikes
            ? `${normalizedRow.pitch_count}-${normalizedRow.strikes}`
            : null),
        w: normalizedRow.w ?? win ?? null,
        l: normalizedRow.l ?? loss ?? null,
        sv: normalizedRow.sv ?? save ?? null,
        hold: normalizedRow.hold ?? hold ?? null,
        result: normalizedRow.result ?? "出賽",
        game_type: normalizedRow.game_type ?? "regular",
      };
    });

    const dedupedDailyReportRows = Array.from(
      new Map(
        dailyReportRows.map((row: any) => {
          const key = row.game_pk
            ? `${row.game_pk}|${row.player_id}`
            : [row.player_id, row.report_date, row.opponent, row.stat_type].join("|");
          return [key, row];
        })
      ).values()
    );

    const { data, error } = await supabase
      .from("daily_reports")
      .upsert(dedupedDailyReportRows, {
        onConflict: "player_id,report_date,opponent",
      })
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
