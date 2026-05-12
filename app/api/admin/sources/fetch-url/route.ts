import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function detectEventType(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("designated") && lower.includes("assignment")) return "dfa";
  if (lower.includes("rehab assignment")) return "rehab";
  if (
    lower.includes("activated") &&
    lower.includes("injured list")
  ) {
    return "active";
  }

  if (lower.includes("injured list")) {
    return "injury";
  }

  if (lower.includes("activated")) {
    return "active";
  }
  if (lower.includes("free agency")) return "free_agent";
  if (lower.includes("assigned")) return "assign";
  if (lower.includes("optioned")) return "option";
  if (lower.includes("recalled")) return "recall";
  if (lower.includes("claimed")) return "waiver_claim";
  if (lower.includes("signed")) return "sign";
  if (lower.includes("traded")) return "trade";

  return "transaction";
}

function convertMlbTeamFromTitle(title: string) {
  const lower = title.toLowerCase();

  if (lower.includes("guardians") || lower.includes("columbus")) return "守護者";
  if (lower.includes("diamondbacks") || lower.includes("reno")) return "響尾蛇";
  if (lower.includes("tigers") || lower.includes("toledo")) return "老虎";
  if (lower.includes("red sox") || lower.includes("worcester")) return "紅襪";
  if (lower.includes("astros") || lower.includes("sugar land")) return "太空人";
  if (lower.includes("giants") || lower.includes("sacramento")) return "巨人";
  if (lower.includes("pirates") || lower.includes("indianapolis")) return "海盜";
  if (lower.includes("phillies") || lower.includes("lehigh valley")) return "費城人";
  if (lower.includes("athletics") || lower.includes("las vegas")) return "運動家";
  if (lower.includes("dodgers") || lower.includes("oklahoma city")) return "道奇";
  if (lower.includes("mariners") || lower.includes("tacoma")) return "水手";
  if (lower.includes("yankees") || lower.includes("scranton")) return "洋基";
  if (lower.includes("brewers") || lower.includes("nashville")) return "釀酒人";
  if (lower.includes("padres") || lower.includes("el paso")) return "教士";
  if (lower.includes("mets") || lower.includes("syracuse")) return "大都會";
  if (lower.includes("blue jays") || lower.includes("buffalo")) return "藍鳥";
  if (lower.includes("white sox") || lower.includes("charlotte")) return "白襪";
  if (lower.includes("braves") || lower.includes("gwinnett")) return "勇士";
  if (lower.includes("rockies") || lower.includes("albuquerque")) return "洛磯";
  if (lower.includes("cardinals") || lower.includes("memphis")) return "紅雀";
  if (lower.includes("angels") || lower.includes("salt lake")) return "天使";
  if (lower.includes("reds") || lower.includes("louisville")) return "紅人";
  if (lower.includes("orioles") || lower.includes("norfolk")) return "金鶯";
  if (lower.includes("cubs") || lower.includes("iowa")) return "小熊";
  if (lower.includes("rays") || lower.includes("durham")) return "光芒";
  if (lower.includes("royals") || lower.includes("omaha")) return "皇家";
  if (lower.includes("rangers") || lower.includes("round rock")) return "遊騎兵";
  if (lower.includes("twins") || lower.includes("st. paul")) return "雙城";
  if (lower.includes("nationals") || lower.includes("rochester")) return "國民";
  if (lower.includes("marlins") || lower.includes("jacksonville")) return "馬林魚";

  return null;
}

function detectLevelFromStatsLabel(label: string) {
  const lower = label.toLowerCase();

  if (lower.includes("mlb")) return "MLB";
  if (lower.includes("milb")) return "AAA";

  return "AAA";
}

function detectSeasonFromLabel(label: string) {
  const match = label.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function shouldKeepTransaction(row: any) {
  if (!row.raw_transaction) return false;
  if (row.event_type === "transaction") return false;

  const lower = row.raw_transaction.toLowerCase();

  if (lower.includes("changed number")) return false;
  if (lower.includes("roster status changed")) return false;

  return true;
}

function summarizeTransaction(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("designated") && lower.includes("assignment")) {
    return "指定讓渡";
  }

  if (lower.includes("rehab assignment")) {
    return "復健賽";
  }

  if (lower.includes("transferred") && lower.includes("60-day injured list")) {
    return "轉入60天傷兵名單";
  }

  if (lower.includes("placed") && lower.includes("injured list")) {
    return "進入傷兵名單";
  }

  if (lower.includes("activated") && lower.includes("injured list")) {
    return "自傷兵名單回歸";
  }

  if (lower.includes("activated")) {
    return "啟用";
  }

  if (lower.includes("elected free agency")) {
    return "成為自由球員";
  }

  if (lower.includes("assigned")) {
    return "分配至球隊";
  }

  if (lower.includes("optioned")) {
    return "下放";
  }

  if (lower.includes("recalled")) {
    return "召回";
  }

  if (lower.includes("claimed")) {
    return "讓渡撿走";
  }

  if (lower.includes("signed")) {
    return "簽約";
  }

  if (lower.includes("traded")) {
    return "交易";
  }



  return text;
}

function getCell(
  headers: string[],
  row: string[],
  name: string
) {
  const index = headers.indexOf(name);

  if (index === -1) return null;

  return row[index] ?? null;
}

function addOneDay(dateText: string | null) {
  if (!dateText) return null;

  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

function convertMlbOrgToZh(name?: string | null) {
  if (!name) return null;

  const lower = name.toLowerCase();

  if (lower.includes("guardians")) return "守護者";
  if (lower.includes("diamondbacks")) return "響尾蛇";
  if (lower.includes("tigers")) return "老虎";
  if (lower.includes("red sox")) return "紅襪";
  if (lower.includes("astros")) return "太空人";
  if (lower.includes("giants")) return "巨人";
  if (lower.includes("pirates")) return "海盜";
  if (lower.includes("phillies")) return "費城人";
  if (lower.includes("athletics")) return "運動家";
  if (lower.includes("dodgers")) return "道奇";
  if (lower.includes("mariners")) return "水手";
  if (lower.includes("yankees")) return "洋基";
  if (lower.includes("brewers")) return "釀酒人";
  if (lower.includes("padres")) return "教士";
  if (lower.includes("mets")) return "大都會";
  if (lower.includes("blue jays")) return "藍鳥";
  if (lower.includes("white sox")) return "白襪";
  if (lower.includes("braves")) return "勇士";
  if (lower.includes("rockies")) return "洛磯";
  if (lower.includes("cardinals")) return "紅雀";
  if (lower.includes("angels")) return "天使";
  if (lower.includes("reds")) return "紅人";
  if (lower.includes("orioles")) return "金鶯";
  if (lower.includes("cubs")) return "小熊";
  if (lower.includes("rays")) return "光芒";
  if (lower.includes("royals")) return "皇家";
  if (lower.includes("rangers")) return "遊騎兵";
  if (lower.includes("twins")) return "雙城";
  if (lower.includes("nationals")) return "國民";
  if (lower.includes("marlins")) return "馬林魚";

  return name;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = body.url;
    const sourceType = body.sourceType;
    const playerId = body.playerId;
    const inputTeamName = body.teamName || null;
    const inputLevel = body.level || null;

    const isMiLBPlayerPage = url.includes("milb.com/player/");
    let finalUrl = url;

    if (isMiLBPlayerPage && sourceType === "game_logs") {
      const match = url.match(/player\/.*-(\d+)/);
      const mlbamId = match?.[1];

      if (mlbamId) {
        const statGroup =
          body.statType === "pitching"
            ? "pitching"
            : "hitting";

        finalUrl =
          `https://statsapi.mlb.com/api/v1/people/${mlbamId}/stats` +
          `?stats=gameLog&group=${statGroup}&season=${
            body.seasonYear || new Date().getFullYear()
          }&sportId=11`;
      }
    }

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const response = await fetch(finalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 TWDS Bot",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    let jsonData: any = null;

    try {
      jsonData = JSON.parse(html);
    } catch {
      jsonData = null;
    }

    if (
      Array.isArray(jsonData?.stats) &&
      jsonData.stats.length > 0 &&
      Array.isArray(jsonData.stats[0]?.splits) &&
      jsonData.stats[0].splits.length > 0
    ) {

      const gameLogsPreview = jsonData.stats[0].splits.map((split: any) => {
        const stat = split.stat ?? {};

        console.log("PITCHING STAT DEBUG", stat);

        const isPitching = body.statType === "pitching";

          return {
            target_table: "daily_reports",
            player_id: playerId,
            stat_type: isPitching ? "pitching" : "batting",

            report_date_text: addOneDay(split.date),
            team_name:
              inputTeamName ||
              convertMlbOrgToZh(split.team?.parentOrgName || split.team?.name),
            league: "美職",
            level: inputLevel || split.sport?.abbreviation || null,
            opponent:
              convertMlbOrgToZh(split.opponent?.parentOrgName || split.opponent?.name),
            position: split.positionsPlayed?.[0]?.abbreviation || null,
            game_pk: split.game?.gamePk ? String(split.game.gamePk) : null,

            // batting
            ab: isPitching ? null : stat.atBats ?? null,
            pa: isPitching ? null : stat.plateAppearances ?? null,
            r: isPitching ? null : stat.runs ?? null,
            h: stat.hits ?? null,
            tb: isPitching ? null : stat.totalBases ?? null,
            doubles: isPitching ? null : stat.doubles ?? null,
            triples: isPitching ? null : stat.triples ?? null,
            hr: stat.homeRuns ?? null,
            rbi: isPitching ? null : stat.rbi ?? null,
            bb: stat.baseOnBalls ?? null,
            ibb: stat.intentionalWalks ?? null,
            k: stat.strikeOuts ?? null,
            sb: isPitching ? null : stat.stolenBases ?? null,
            cs: isPitching ? null : stat.caughtStealing ?? null,
            hbp: stat.hitByPitch ?? null,
            sf: isPitching ? null : stat.sacFlies ?? null,

            // pitching
            win: isPitching ? Number(stat.wins ?? 0) : null,
            loss: isPitching ? Number(stat.losses ?? 0) : null,

            g: isPitching ? Number(stat.gamesPlayed ?? stat.games ?? 1) : null,
            gs: isPitching ? Number(stat.gamesStarted ?? 0) : null,
            cg: isPitching ? Number(stat.completeGames ?? 0) : null,
            sho: isPitching ? Number(stat.shutouts ?? 0) : null,
            save: isPitching ? Number(stat.saves ?? 0) : null,
            svo: isPitching ? Number(stat.saveOpportunities ?? 0) : null,

            ip: isPitching ? stat.inningsPitched ?? null : null,
            er: isPitching ? stat.earnedRuns ?? null : null,
            pitch_count: isPitching ? stat.numberOfPitches ?? null : null,
            strikes:
              isPitching
                ? stat.strikes ?? stat.numberOfStrikes ?? null
                : null,
            whip: isPitching ? stat.whip ?? null : null,
            era: isPitching ? stat.era ?? null : null,

            official_avg: stat.avg ?? null,
            official_obp: stat.obp ?? null,
            official_slg: stat.slg ?? null,
          };
        });

      return NextResponse.json({
        ok: true,
        title: "MLB Stats API gameLog",
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview: [],
        transactionsPreview: [],
        gameLogsPreview,
        tables: [],
      });
    }
    const $ = cheerio.load(html);
    const title = $("title").text();

    const tablePreview: any[] = [];

    $("table").each((index, table) => {
      const headers: string[] = [];

      $(table)
        .find("thead th")
        .each((_, th) => {
          headers.push($(th).text().trim());
        });

      if (!headers.length) return;

      const rows: string[][] = [];

      $(table)
        .find("tbody tr")
        .each((_, tr) => {
          const cells: string[] = [];

          $(tr)
            .find("td")
            .each((__, td) => {
              cells.push($(td).text().trim());
            });

          if (cells.length) rows.push(cells);
        });

      tablePreview.push({
        index,
        headers,
        rows: rows.slice(0, 50),
      });
    });

    const detectedTeamName =
      inputTeamName || convertMlbTeamFromTitle(title) || "未判定球隊";

    const seasonStatsPreview = tablePreview
      .filter((table) => {
        const headers = table.headers;

        if (body.statType === "pitching") {
          return (
            headers.includes("Year") &&
            headers.includes("ERA") &&
            headers.includes("IP") &&
            headers.includes("WHIP")
          );
        }

        return (
          headers.includes("Year") &&
          headers.includes("AB") &&
          headers.includes("AVG")
        );
      })
      .flatMap((table) =>
        table.rows
          .filter((row: string[]) => {
            const label = row[0] || "";

            if (label.includes("Career")) return false;

            return (
              /^\d{4}/.test(label) ||
              label.includes("teams") ||
              label.includes("Minors")
            );
          })
          .map((row: string[]) => {
            const label = row[0] || "";

          const isPitching = body.statType === "pitching";

          return {
            target_table: "season_stats",
            player_id: playerId,
            season_year:
              Number(body.seasonYear) ||
              detectSeasonFromLabel(label),

            league: "美職",
            team_name: detectedTeamName,
            level:
              inputLevel ||
              detectLevelFromStatsLabel(label),

            stat_type: isPitching
              ? "pitching"
              : "batting",

            // batting
            ab: isPitching ? null : Number(row[1]),
            r: isPitching ? null : Number(row[2]),
            h: Number(row[3]),
            hr: Number(row[4]),
            rbi: isPitching ? null : Number(row[5]),
            sb: isPitching ? null : Number(row[6]),

            // pitching
            win: isPitching ? Number(row[1]) : null,
            loss: isPitching ? Number(row[2]) : null,
            era: isPitching ? row[3] : null,
            g: isPitching ? Number(row[4]) : null,
            gs: isPitching ? Number(row[5]) : null,
            ip: isPitching ? row[6] : null,
            bb: isPitching ? Number(row[7]) : null,
            k: isPitching ? Number(row[8]) : null,
            whip: isPitching ? row[9] : null,

            official_avg: row[7] ?? null,
            official_obp: row[8] ?? null,
            official_ops: row[9] ?? null,
          };
        })
      );

    const gameLogsPreview = tablePreview
      .filter((table) => {
        const headers = table.headers;

        return (
          headers.includes("Date") &&
          headers.includes("Team") &&
          headers.includes("OPP") &&
          headers.includes("AB")
        );
      })
      .flatMap((table) =>
        table.rows.map((row: string[]) => ({
          target_table: "daily_reports",

          player_id: playerId,

          stat_type: "batting",

          report_date_text: getCell(
            table.headers,
            row,
            "Date"
          ),

          team_name: getCell(
            table.headers,
            row,
            "Team"
          ),

          opponent: convertMlbOrgToZh(
            getCell(table.headers, row, "OPP")
          ),

          era: getCell(
            table.headers,
            row,
            "ERA"
          ),

          ab: Number(
            getCell(table.headers, row, "AB") || 0
          ),

          r: Number(
            getCell(table.headers, row, "R") || 0
          ),

          h: Number(
            getCell(table.headers, row, "H") || 0
          ),

          hr: Number(
            getCell(table.headers, row, "HR") || 0
          ),

          rbi: Number(
            getCell(table.headers, row, "RBI") || 0
          ),

          bb: Number(
            getCell(table.headers, row, "BB") || 0
          ),

          k: Number(
            getCell(table.headers, row, "SO") || 0
          ),

          sb: Number(
            getCell(table.headers, row, "SB") || 0
          ),

          official_avg: getCell(
            table.headers,
            row,
            "AVG"
          ),

          official_obp: getCell(
            table.headers,
            row,
            "OBP"
          ),

          official_slg: getCell(
            table.headers,
            row,
            "SLG"
          ),
        }))
      );

    const transactionsPreview = tablePreview
      .filter(
        (table) =>
          table.headers.includes("Date") &&
          table.headers.includes("Transaction")
      )
      .flatMap((table) =>
        table.rows.map((row: string[]) => {
          const rawTransaction = row[2] || "";
          const eventType = detectEventType(rawTransaction);

          return {
            target_table: "player_events",
            player_id: playerId,
            event_date_text: row[1],
            event_type: eventType,
            raw_transaction: rawTransaction,
            note: summarizeTransaction(rawTransaction),
          };
        })
      )
      .filter(shouldKeepTransaction);

      const dedupedTransactionsPreview = Array.from(
        new Map(
          transactionsPreview.map((row) => {
            const key = [
              row.player_id,
              row.event_date_text,
              row.event_type,
              row.note,
            ].join("|");

            return [key, row];
          })
        ).values()
      );

    return NextResponse.json({
      ok: true,
      title,
      htmlLength: html.length,
      detectedTeamName,
      seasonStatsPreview,
      transactionsPreview: dedupedTransactionsPreview,
      gameLogsPreview,
      tables: tablePreview,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}