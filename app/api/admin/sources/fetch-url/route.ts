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

function getMlbStatsApiSportId(level: string | null, wantsMinors: boolean) {
  const normalized = normalizeText(level).toUpperCase();

  if (!wantsMinors) return 1; // MLB

  if (normalized === "AAA" || normalized === "3A") return 11;
  if (normalized === "AA" || normalized === "2A") return 12;
  if (normalized === "A+" || normalized === "HIGH-A") return 13;
  if (normalized === "A" || normalized === "1A") return 14;
  if (normalized === "ROK" || normalized === "RK" || normalized === "ACL" || normalized === "FCL") return 16;

  return 11;
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

async function getParentTeamNameFromMlbApi(teamId: number | string | null) {
  if (!teamId) return null;

  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/teams/${teamId}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const team = json?.teams?.[0];

    return (
      convertMlbOrgToZh(team?.parentOrgName) ||
      convertMlbOrgToZh(team?.parentOrg?.name) ||
      null
    );
  } catch {
    return null;
  }
}

function normalizeText(value: any) {
  return String(value ?? "").replace(/[\s\u3000]+/g, "").trim();
}

function toNumber(value: any) {
  const text = normalizeText(value).replace(/,/g, "");
  if (!text || text === "-" || text === ".---") return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function getCellByAliases(headers: string[], row: string[], aliases: string[]) {
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    const index = headers.findIndex(
      (header) => normalizeText(header) === normalizedAlias
    );

    if (index !== -1) return row[index] ?? null;
  }

  return null;
}

function ipToInnings(ipValue: unknown) {
  const value = String(ipValue ?? "").trim();

  if (!value) return null;

  // 5 1/3
  const fractionMatch = value.match(/^(\d+)\s+([12])\/3$/);
  if (fractionMatch) {
    return Number(fractionMatch[1]) + Number(fractionMatch[2]) / 3;
  }

  const compactFractionMatch = value.match(/^(\d+)([12])\/3$/);
  if (compactFractionMatch) {
    return Number(compactFractionMatch[1]) + Number(compactFractionMatch[2]) / 3;
  }

  const [wholeText, decimalText = "0"] = value.split(".");
  const whole = Number(wholeText);
  const decimal = Number(decimalText);

  if (!Number.isFinite(whole)) return null;

  if (decimal === 1) return whole + 1 / 3;
  if (decimal === 2) return whole + 2 / 3;

  return whole;
}

function roundTo(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return null;

  const base = 10 ** digits;
  return Math.round(value * base) / base;
}

function rate3(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator <= 0) return null;

  return (numerator / denominator).toFixed(3).replace(/^0/, "");
}

function ratePercent(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator <= 0) return null;

  return roundTo((numerator / denominator) * 100, 1);
}

function perNine(count: number | null, innings: number | null) {
  if (count === null || innings === null || innings <= 0) return null;

  return roundTo((count * 9) / innings, 2);
}

function parseAsiaDate(text: string, seasonYear: number) {
  const raw = normalizeText(text);
  if (!raw) return null;

  const full = raw.match(/(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
  if (full) {
    return `${full[1]}-${full[2].padStart(2, "0")}-${full[3].padStart(2, "0")}`;
  }

  const md = raw.match(/(\d{1,2})[\/.-](\d{1,2})/);
  if (md) {
    return `${seasonYear}-${md[1].padStart(2, "0")}-${md[2].padStart(2, "0")}`;
  }

  return null;
}

function parseDecision(text: string) {
  const raw = normalizeText(text).toUpperCase();

  return {
    win: raw === "W" || raw.includes("勝") || raw.includes("승") ? 1 : 0,
    loss: raw === "L" || raw.includes("敗") || raw.includes("패") ? 1 : 0,
    save: raw === "S" || raw.includes("セ") || raw.includes("세") ? 1 : 0,
    hold: raw === "H" || raw.includes("ホ") || raw.includes("홀") ? 1 : 0,
  };
}

function buildGamePk(params: {
  leagueType: string;
  playerId: string;
  statType: string;
  date: string | null;
  opponent: string | null;
}) {
  return [
    params.leagueType,
    params.playerId,
    params.statType,
    params.date ?? "unknown-date",
    params.opponent ?? "unknown-opp",
  ].join(":");
}

function parseNpbKboGameLogs(params: {
  tablePreview: any[];
  playerId: string;
  statType: string;
  leagueType: "NPB" | "KBO";
  teamName: string | null;
  level: string | null;
  seasonYear: number;
}) {
  const isPitching =
    params.statType === "pitching" ||
    params.statType === "pitcher" ||
    params.statType === "投手";
  const league = params.leagueType === "NPB" ? "日職" : "韓職";
  const defaultLevel =
    params.level || (params.leagueType === "NPB" ? "日職一軍" : "韓職一軍");

  return params.tablePreview
    .filter((table) => {
      const headers = Array.isArray(table.headers)
        ? table.headers.map((h: any) => normalizeText(h))
        : [];

      const hasDate = headers.some((h: string) =>
        ["日付", "日時", "日期", "날짜", "일자", "Date"].includes(h) ||
        /^\d{1,2}월$/.test(h)
      );

      if (!hasDate) return false;

      if (isPitching) {
        return (
          headers.includes("IP") ||
          headers.includes("이닝") ||
          headers.includes("TBF") ||
          headers.includes("ERA")
        );
      }

      return headers.some((h: string) =>
        ["打数", "AB", "타수"].includes(h)
      );
    })
    .flatMap((table) =>
      table.rows
        .filter((row: string[]) => {
          const first = normalizeText(row[0]);

          return (
            first !== "합계" &&
            first !== "全部的" &&
            first !== "全部"
          );
        })
        .map((row: string[]) => {
        const headers = table.headers;

        const rawDate =
          getCellByAliases(headers, row, [
            "日付",
            "日時",
            "日期",
            "날짜",
            "일자",
            "Date",
          ]) ?? row[0];

        const reportDate = parseAsiaDate(
          String(rawDate ?? ""),
          params.seasonYear
        );

        const rawOpponent = normalizeText(
          getCellByAliases(headers, row, [
            "相手",
            "対戦",
            "対戦相手",
            "상대",
            "OPP",
            "Opponent",
          ]) ?? row[1]
        );

        const opponent =
          params.leagueType === "KBO"
            ? convertKboTeamName(rawOpponent)
            : rawOpponent;

        const decision = parseDecision(
          String(
            getCellByAliases(headers, row, [
              "勝敗",
              "結果",
              "결과",
              "Dec",
              "Decision",
            ]) ?? ""
          )
        );

        const common = {
          target_table: "daily_reports",
          player_id: params.playerId,
          stat_type: isPitching ? "pitching" : "batting",
          report_date_text: reportDate,
          team_name: params.teamName,
          league,
          level: defaultLevel,
          opponent,
          game_pk: buildGamePk({
            leagueType: params.leagueType,
            playerId: params.playerId,
            statType: params.statType,
            date: reportDate,
            opponent,
          }),
        };

        if (isPitching) {
          const npRaw = normalizeText(
            getCellByAliases(headers, row, [
              "球数",
              "投球数",
              "NP",
              "투구수",
            ])
          );

          const [pitchCountText, strikesText] = npRaw.includes("-")
            ? npRaw.split("-")
            : [npRaw, null];

          const ip = normalizeText(
            getCellByAliases(headers, row, ["IP", "이닝", "投球回"])
          );

          const innings = ipToInnings(ip);

          const h = toNumber(
            getCellByAliases(headers, row, ["H", "피안타", "被安打"])
          );

          const bb = toNumber(
            getCellByAliases(headers, row, ["BB", "볼넷", "与四球", "四壞球"])
          );

          const whip =
            innings !== null && innings > 0 && h !== null && bb !== null
              ? roundTo((h + bb) / innings, 2)
              : null;

          return {
            ...common,
            win: decision.win,
            loss: decision.loss,
            save: decision.save,
            hold: decision.hold,
            g: 1,
            gs: 0,

            bf: toNumber(getCellByAliases(headers, row, ["TBF", "BF", "타자", "타자수"])),
            ip,
            h,
            r: toNumber(getCellByAliases(headers, row, ["R", "실점", "失分"])),
            er: toNumber(getCellByAliases(headers, row, ["ER", "자책", "자책점", "責失"])),
            hr: toNumber(getCellByAliases(headers, row, ["HR", "피홈런", "被本塁打", "被全壘打"])),
            bb,
            hbp: toNumber(getCellByAliases(headers, row, ["HBP", "사구", "与死球", "觸身球"])),
            k: toNumber(getCellByAliases(headers, row, ["SO", "K", "삼진", "奪三振", "三振"])),

            pitch_count: null,
            strikes: null,
            era: normalizeText(
              getCellByAliases(headers, row, [
                "ERA2",
                "ERA",
                "防御率",
                "防禦率",
              ])
            ),
            whip,
            avg: normalizeText(getCellByAliases(headers, row, ["AVG", "被打率"])),
          };
        }

        return {
          ...common,
          ab: toNumber(getCellByAliases(headers, row, ["打数", "AB", "타수"])),
          pa: toNumber(getCellByAliases(headers, row, ["打席", "PA", "타석"])),
          r: toNumber(getCellByAliases(headers, row, ["得点", "R", "득점"])),
          h: toNumber(getCellByAliases(headers, row, ["安打", "H", "안타"])),
          tb: toNumber(getCellByAliases(headers, row, ["塁打", "TB", "루타"])),
          doubles: toNumber(getCellByAliases(headers, row, ["二塁打", "2B", "2루타"])),
          triples: toNumber(getCellByAliases(headers, row, ["三塁打", "3B", "3루타"])),
          hr: toNumber(getCellByAliases(headers, row, ["本塁打", "HR", "홈런"])),
          rbi: toNumber(getCellByAliases(headers, row, ["打点", "RBI", "타점"])),
          bb: toNumber(getCellByAliases(headers, row, ["四球", "BB", "볼넷"])),
          ibb: toNumber(getCellByAliases(headers, row, ["敬遠", "IBB", "고의4구"])),
          k: toNumber(getCellByAliases(headers, row, ["三振", "SO", "삼진"])),
          hbp: toNumber(getCellByAliases(headers, row, ["死球", "HBP", "사구"])),
          sf: toNumber(getCellByAliases(headers, row, ["犠飛", "SF", "희비"])),
          sb: toNumber(getCellByAliases(headers, row, ["盗塁", "SB", "도루"])),
          cs: toNumber(getCellByAliases(headers, row, ["盗塁死", "CS", "도실"])),
          official_avg: normalizeText(getCellByAliases(headers, row, ["打率", "AVG", "타율"])),
          official_obp: normalizeText(getCellByAliases(headers, row, ["出塁率", "OBP", "출루율"])),
          official_slg: normalizeText(getCellByAliases(headers, row, ["長打率", "SLG", "장타율"])),
        };
      })
    );
}

function convertPacificLeagueOpponentFromImg(src?: string | null) {
  const text = String(src ?? "").toLowerCase();

  if (text.includes("eagles")) return "樂天金鷲";
  if (text.includes("hawks")) return "軟銀鷹";
  if (text.includes("fighters")) return "日本火腿";
  if (text.includes("marines")) return "羅德";
  if (text.includes("buffaloes")) return "歐力士";
  if (text.includes("lions")) return "西武獅";

  return null;
}

function convertKboTeamName(name: string) {
  const map: Record<string, string> = {
    두산: "斗山熊",
    LG: "LG雙子",
    삼성: "三星獅",
    SSG: "SSG登陸者",
    키움: "培證英雄",
    KT: "KT巫師",
    KIA: "起亞虎",
    NC: "NC恐龍",
    롯데: "樂天巨人",
    한화: "韓華鷹",
  };

  return map[name] || name;
}

function parsePacificLeaguePitchingGameLogs(params: {
  $: cheerio.CheerioAPI;
  playerId: string;
  teamName: string | null;
  level: string | null;
  seasonYear: number;
}) {
  const rows: any[] = [];

  params.$("#gameByPitching table.c-gamestats--child tr.c-gamestats_bodyRow").each(
    (_, tr) => {
      const $tr = params.$(tr);

      const dateText = normalizeText(
        $tr.find("a.c-gamestats_date").first().text()
      );

      const gameHref =
        $tr.find("a.c-gamestats_date").first().attr("href") || "";

      const opponentImgSrc =
        $tr.find("span.c-gamestats_versus img").first().attr("src") || null;

      const opponent = convertPacificLeagueOpponentFromImg(opponentImgSrc);

      const cells = $tr
        .find("td")
        .toArray()
        .map((td) => normalizeText(params.$(td).text()));

      if (!dateText || cells.length < 9) return;

      const reportDate = parseAsiaDate(dateText, params.seasonYear);
      const gameId = gameHref.match(/\/game\/(\d+)/)?.[1] ?? null;

      rows.push({
        target_table: "daily_reports",
        player_id: params.playerId,
        stat_type: "pitching",
        report_date_text: reportDate,
        team_name: params.teamName,
        league: "日職",
        level: params.level || "日職一軍",
        opponent,
        game_pk: gameId
          ? `NPB:${gameId}:${params.playerId}:pitching`
          : buildGamePk({
              leagueType: "NPB",
              playerId: params.playerId,
              statType: "pitching",
              date: reportDate,
              opponent,
            }),

        g: 1,
        ip: cells[0] || null,
        h: toNumber(cells[1]),
        hr: toNumber(cells[2]),
        k: toNumber(cells[3]),
        bb: toNumber(cells[4]),
        hbp: toNumber(cells[5]),
        r: toNumber(cells[6]),
        er: toNumber(cells[7]),
        era: cells[8] || null,
      });
    }
  );

  return rows;
}

function parsePacificLeagueBattingGameLogs(params: {
  $: cheerio.CheerioAPI;
  playerId: string;
  teamName: string | null;
  level: string | null;
  seasonYear: number;
}) {
  const rows: any[] = [];

  params.$("#gameByBatting table.c-gamestats--child tr.c-gamestats_bodyRow").each(
    (_, tr) => {
      const $tr = params.$(tr);

      const dateText = normalizeText(
        $tr.find("a.c-gamestats_date").first().text()
      );

      const gameHref =
        $tr.find("a.c-gamestats_date").first().attr("href") || "";

      const opponentImgSrc =
        $tr.find("span.c-gamestats_versus img").first().attr("src") || null;

      const opponent = convertPacificLeagueOpponentFromImg(opponentImgSrc);

      const cells = $tr
        .find("td")
        .toArray()
        .map((td) => normalizeText(params.$(td).text()));

      if (!dateText || cells.length < 11) return;

      const reportDate = parseAsiaDate(dateText, params.seasonYear);
      const gameId = gameHref.match(/\/game\/(\d+)/)?.[1] ?? null;

      rows.push({
        target_table: "daily_reports",
        player_id: params.playerId,
        stat_type: "batting",
        report_date_text: reportDate,
        team_name: params.teamName,
        league: "日職",
        level: params.level || "日職一軍",
        opponent,
        game_pk: gameId
          ? `NPB:${gameId}:${params.playerId}:batting`
          : buildGamePk({
              leagueType: "NPB",
              playerId: params.playerId,
              statType: "batting",
              date: reportDate,
              opponent,
            }),

        ab: toNumber(cells[0]),
        h: toNumber(cells[1]),
        hr: toNumber(cells[2]),
        r: toNumber(cells[3]),
        rbi: toNumber(cells[4]),
        k: toNumber(cells[5]),
        bb: toNumber(cells[6]),
        hbp: toNumber(cells[7]),
        sb: toNumber(cells[8]),
        sf: null,
        official_avg: cells[10] || null,
        stats: cells[11] || null,
      });
    }
  );

  return rows;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = body.url;
    const sourceType = body.sourceType;
    const playerId = body.playerId;
    const players = body.players ?? [];
    const inputTeamName = body.teamName || null;
    const inputLevel = body.level || null;
    const leagueType = body.leagueType || "MLB_MILB";

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const isPlayerPage =
      String(url).includes("milb.com/player/") ||
      String(url).includes("mlb.com/player/");

    const isMlbPlayerPage = String(url).includes("mlb.com/player/");
    const isMilbPlayerPage = String(url).includes("milb.com/player/");

    let finalUrl = url;

    if ((isMlbPlayerPage || isMilbPlayerPage) && sourceType === "game_logs") {
      const match = url.match(/player\/.*-(\d+)/);
      const mlbamId = match?.[1];

      if (mlbamId) {
        const statGroup =
          body.statType === "pitching" ? "pitching" : "hitting";

        const wantsMinors =
          String(url).includes("minors") ||
          String(url).includes("milb");

        const sportId = getMlbStatsApiSportId(inputLevel, wantsMinors);

        finalUrl =
          `https://statsapi.mlb.com/api/v1/people/${mlbamId}/stats` +
          `?stats=gameLog&group=${statGroup}&season=${
            body.seasonYear || new Date().getFullYear()
          }&sportId=${sportId}`;
      }
    }

    if ((isMlbPlayerPage || isMilbPlayerPage) && sourceType === "season_stats") {
      const match = url.match(/player\/.*-(\d+)/);
      const mlbamId = match?.[1];

      if (mlbamId) {
        const statGroup =
          body.statType === "pitching" ? "pitching" : "hitting";

        const wantsMinors =
          String(url).includes("minors") ||
          String(url).includes("milb");

        const sportId = getMlbStatsApiSportId(inputLevel, wantsMinors);

        finalUrl =
          `https://statsapi.mlb.com/api/v1/people/${mlbamId}/stats` +
          `?stats=season&group=${statGroup}&season=${
            body.seasonYear || new Date().getFullYear()
          }&sportId=${sportId}`;
      }
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

    if (sourceType === "season_stats") {

      const wantsMinors =
        String(url).includes("minors") ||
        String(url).includes("milb");

      const isPitching = body.statType === "pitching";

      const filteredSplits = jsonData.stats[0].splits.filter((split: any) => {
        const splitSeason = Number(split.season);
        const selectedSeason = Number(body.seasonYear) || new Date().getFullYear();

        if (
          wantsMinors &&
          !split?.team?.id &&
          !split?.team?.name
        ) return false;

        return splitSeason === selectedSeason;
      });

      const seasonStatsPreview = await Promise.all(
        filteredSplits.map(async (split: any) => {
          const stat = split?.stat ?? {};

          const minorTeamCode =
            split?.team?.abbreviation ||
            split?.team?.name ||
            "";

          const parentTeamName =
            convertMlbOrgToZh(split?.team?.parentOrgName) ||
            (wantsMinors
              ? await getParentTeamNameFromMlbApi(split?.team?.id)
              : null) ||
            inputTeamName ||
            "未判定球隊";

          return {
            target_table: "season_stats",
            player_id: playerId,
            season_year: Number(split.season) || Number(body.seasonYear) || new Date().getFullYear(),
            league: "美職",
            team_name: wantsMinors
              ? parentTeamName
              : inputTeamName || parentTeamName,

            level:
              split?.sport?.abbreviation ||
              inputLevel ||
              (wantsMinors ? "AAA" : "MLB"),
            stat_type: isPitching ? "pitching" : "batting",

            win: isPitching ? Number(stat.wins ?? 0) : null,
            loss: isPitching ? Number(stat.losses ?? 0) : null,
            era: isPitching ? stat.era ?? null : null,
            g: Number(stat.gamesPlayed ?? stat.games ?? 0),
            gs: isPitching ? Number(stat.gamesStarted ?? 0) : null,
            cg: isPitching ? Number(stat.completeGames ?? 0) : null,
            sho: isPitching ? Number(stat.shutouts ?? 0) : null,
            hold: isPitching ? Number(stat.holds ?? 0) : null,
            save: isPitching ? Number(stat.saves ?? 0) : null,
            svo: isPitching ? Number(stat.saveOpportunities ?? 0) : null,

            ip: isPitching ? stat.inningsPitched ?? null : null,
            bf: isPitching ? stat.battersFaced ?? null : null,
            h: stat.hits ?? null,
            r: stat.runs ?? null,
            er: isPitching ? stat.earnedRuns ?? null : null,
            hr: stat.homeRuns ?? null,
            pitch_count: isPitching ? stat.numberOfPitches ?? null : null,
            hbp: stat.hitByPitch ?? null,
            bb: stat.baseOnBalls ?? null,
            ibb: stat.intentionalWalks ?? null,
            k: stat.strikeOuts ?? null,

            official_avg: stat.avg ?? null,
            official_obp: stat.obp ?? null,
            official_slg: stat.slg ?? null,
            official_ops: stat.ops ?? null,
            official_whip: stat.whip ?? null,

            k9: stat.strikeoutsPer9Inn ?? null,
            bb9: stat.walksPer9Inn ?? null,
            hr9: stat.homeRunsPer9 ?? null,
            h9: stat.hitsPer9Inn ?? null,
            kbb: stat.strikeoutWalkRatio ?? null,
          };
        })
      );

      return NextResponse.json({
        ok: true,
        title: "MLB Stats API season",
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview,
        transactionsPreview: [],
        gameLogsPreview: [],
        tables: [],
      });
    }

      const gameLogsPreview = jsonData.stats[0].splits.map((split: any) => {
        const stat = split.stat ?? {};

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

            // shared
            r: stat.runs ?? null,
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

            bf: isPitching ? stat.battersFaced ?? null : null,
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
          headers.push(normalizeText($(th).text()));
        });

      if (!headers.length) {
        $(table)
          .find("tr")
          .first()
          .find("th, td")
          .each((_, cell) => {
            headers.push(normalizeText($(cell).text()));
          });
      }

      if (!headers.length) return;

      const rows: string[][] = [];

      $(table)
        .find("tr")
        .slice(1)
        .each((_, tr) => {
          const cells: string[] = [];

          $(tr)
            .find("th, td")
            .each((__, td) => {
              cells.push($(td).text().trim());
            });

          if (cells.length) rows.push(cells);
        });

      tablePreview.push({
        index,
        headers,
        rows,
      });
    });

    function parsePacificLeagueSeasonStats(params: {
      tablePreview: any[];
      playerId: string;
      teamName: string | null;
      level: string | null;
      seasonYear: number;
      statType: string;
    }) {
      const isPitching = params.statType === "pitching";

      return params.tablePreview
        .filter((table) => {
          const headers = table.headers ?? [];

          if (isPitching) {
            return false;
          }

          const safeHeaders = Array.isArray(headers) ? headers.map(normalizeText) : [];

          return (
            (safeHeaders.includes("打率") || safeHeaders.includes("打擊率")) &&
            (safeHeaders.includes("打数") || safeHeaders.includes("打數")) &&
            (safeHeaders.includes("年度") || safeHeaders.includes("年"))
          );
        })
        .flatMap((table) => {
          const headers = table.headers ?? [];

          return table.rows
            .filter((row: string[]) => /^\d{4}$/.test(String(row[0] ?? "")))
            .map((row: string[]) => {
              const seasonYear = Number(row[0]) || params.seasonYear;
              const g = toNumber(getCellByAliases(headers, row, ["試合", "出賽數"]));
              const pa = toNumber(getCellByAliases(headers, row, ["打席", "打席数"]));
              const ab = toNumber(getCellByAliases(headers, row, ["打数", "打數"]));
              const r = toNumber(getCellByAliases(headers, row, ["得点", "得分"]));
              const h = toNumber(getCellByAliases(headers, row, ["安打"]));
              const doubles = toNumber(getCellByAliases(headers, row, ["二塁打", "二壘安打"]));
              const triples = toNumber(getCellByAliases(headers, row, ["三塁打", "三壘安打"]));
              const hr = toNumber(getCellByAliases(headers, row, ["本塁打", "全壘打"]));
              const tb = toNumber(getCellByAliases(headers, row, ["塁打", "塁打数", "壘打數"]));
              const rbi = toNumber(getCellByAliases(headers, row, ["打点", "打點"]));
              const bb = toNumber(getCellByAliases(headers, row, ["四球", "四壞球"]));
              const hbp = toNumber(getCellByAliases(headers, row, ["死球"]));
              const k = toNumber(getCellByAliases(headers, row, ["三振", "三振出局"]));
              const sb = toNumber(getCellByAliases(headers, row, ["盗塁", "盜壘"]));
              const cs = toNumber(getCellByAliases(headers, row, ["盗塁死", "盜壘刺"]));
              const sf = toNumber(getCellByAliases(headers, row, ["犠飛", "犠牲飛行", "犧牲飛行"]));

              const avg = rate3(h, ab);
              const obp = rate3(
                h !== null && bb !== null && hbp !== null ? h + bb + hbp : null,
                ab !== null && bb !== null && hbp !== null && sf !== null
                  ? ab + bb + hbp + sf
                  : null
              );
              const slg = rate3(tb, ab);
              const ops =
                obp !== null && slg !== null
                  ? (Number(obp) + Number(slg)).toFixed(3).replace(/^0/, "")
                  : null;
              const babip = rate3(
                h !== null && hr !== null ? h - hr : null,
                ab !== null && k !== null && hr !== null && sf !== null
                  ? ab - k - hr + sf
                  : null
              );

              return {
                target_table: "season_stats",
                player_id: params.playerId,
                season_year: seasonYear,
                league: "日職",
                level: params.level || "日職一軍",
                stat_type: "batting",
                team_name: params.teamName || "未判定球隊",

                g,
                pa,
                ab,
                r,
                h,
                tb,
                doubles,
                triples,
                hr,
                rbi,
                bb,
                ibb: null,
                hbp,
                k,
                sb,
                cs,
                sf,
                go_ao: null,

                official_avg: avg,
                official_obp: obp,
                official_slg: slg,
                official_ops: ops,
                official_k_rate: ratePercent(k, pa),
                official_bb_rate: ratePercent(bb, pa),
                official_babip: babip,
              };
            });
        });
      }

    function parseBaseballDataFarmSeasonStats(params: {
      tablePreview: any[];
      playerId: string;
      players?: any[];
      playerName?: string | null;
      teamName: string | null;
      statType: string;
      league: string;
      level: string;
      seasonYear: number;
    }) {
      const isPitching = params.statType === "pitching";

      return params.tablePreview.flatMap((table: any): any[] => {
        const selectedNames = [
          params.playerName,
          body.selectedPlayerNameJa,
        ]
          .map(normalizeText)
          .filter(Boolean)
          .flatMap((name) => [
            name,
            name.replace(/彥/g, "彦"),
          ]);

        const matchedRows = table.rows
          .filter((row: string[]) => {
            const nameCell = normalizeText(row[1] || row[0]);
            const joinedRow = normalizeText(row.join(" "));

            return selectedNames.some((name) => {
              return (
                nameCell.includes(name) ||
                joinedRow.includes(name) ||
                name.includes(nameCell)
              );
            });
          })
          .map((row: string[]) => ({
            row,
            playerId: params.playerId,
          }));

        if (isPitching) {
          return matchedRows
            .filter(({ row }: { row: string[] }) => row.length >= 18)
            .map(({ row, playerId }: { row: string[]; playerId: string }) => {
              // baseball-data 投手表固定欄位：
              // 0背番号/年度, 1選手名/チーム, 2防御率, 3試合/登板, 4完投,
              // 5完封, 6無四球, 7勝利, 8敗北, 9ホールド, 10HP,
              // 11セーブ, 12勝率, 13投球回, 14打者, 15被本塁打,
              // 16奪三振, 17与四球, 18与死球, 19暴投, 20ボーク,
              // 21BB/9, 22K/9, 23K/BB, 24WHIP, 25被打率, 26被BABIP
              const isFarmShortPitchingRow = row.length <= 20;

              if (isFarmShortPitchingRow) {
                const eraRaw = row[2] || null;
                const g = toNumber(row[3]);
                const win = toNumber(row[4]);
                const loss = toNumber(row[5]);
                const save = toNumber(row[6]);

                const bf = toNumber(row[8]);
                const ip = row[9] || null;

                const h = toNumber(row[10]);
                const hr = toNumber(row[11]);
                const bb = toNumber(row[12]);
                const hbp = toNumber(row[13]);
                const k = toNumber(row[14]);
                const r = toNumber(row[15]);
                const er = toNumber(row[16]);

                const whipRaw = row[17] || null;
                const kbb = row[18] || null;

                const innings = ipToInnings(ip);

                return {
                  target_table: "season_stats",
                  player_id: playerId,
                  season_year: params.seasonYear,
                  league: params.league,
                  level: params.level,
                  stat_type: "pitching",
                  team_name: params.teamName || "未判定球隊",

                  win,
                  loss,
                  era: eraRaw,
                  g,

                  gs: null,
                  cg: null,
                  sho: null,
                  hold: null,
                  save,
                  svo: null,

                  ip,
                  bf,
                  h,
                  r,
                  er,
                  hr,

                  pitch_count: null,
                  hbp,
                  bb,
                  ibb: null,
                  k,

                  official_avg: null,
                  whip: whipRaw,
                  go_ao: null,

                  k9: perNine(k, innings),
                  bb9: perNine(bb, innings),
                  hr9: perNine(hr, innings),
                  h9: perNine(h, innings),
                  kbb: toNumber(kbb),
                };
              }
              
              const eraRaw = row[2] || null;
              const g = toNumber(row[3]);
              const cg = toNumber(row[4]);
              const sho = toNumber(row[5]);
              const win = toNumber(row[7]);
              const loss = toNumber(row[8]);
              const hold = toNumber(row[9]);
              const save = toNumber(row[11]);
              const ip = row[13] || null;
              const innings = ipToInnings(ip);
              const bf = toNumber(row[14]);
              const hr = toNumber(row[15]);
              const k = toNumber(row[16]);
              const bb = toNumber(row[17]);
              const hbp = toNumber(row[18]);
              const whipRaw = row[24] || null;
              const avgAgainst = row[25] || null;

              const eraNumber = toNumber(eraRaw);
              const whipNumber = toNumber(whipRaw);

              const er =
                innings !== null &&
                innings > 0 &&
                eraNumber !== null
                  ? Math.round((eraNumber * innings) / 9)
                  : null;

              const h =
                innings !== null &&
                innings > 0 &&
                whipNumber !== null &&
                bb !== null
                  ? Math.round(whipNumber * innings - bb)
                  : null;

              return {
                target_table: "season_stats",
                player_id: playerId,
                season_year: params.seasonYear,
                league: params.league,
                level: params.level,
                stat_type: "pitching",
                team_name: params.teamName || "未判定球隊",

                win,
                loss,
                era: eraRaw,
                g,
                gs: null,
                cg,
                sho,
                hold,
                save,
                svo: null,
                ip,
                bf,
                h,
                r: null,
                er,
                hr,
                pitch_count: null,
                hbp,
                bb,
                ibb: null,
                k,
                official_avg: avgAgainst,
                whip: whipRaw,
                go_ao: null,
              };
            });
        }

        return matchedRows
          .filter(({ row }: { row: string[] }) => row.length >= 18)
          .map(({ row, playerId }: { row: string[]; playerId: string }) => {
            // baseball-data 打者表固定欄位：
            // 0背番号, 1選手名, 2打率, 3試合, 4打席数, 5打数,
            // 6安打, 7本塁打, 8打点, 9盗塁, 10四球, 11死球,
            // 12三振, 13犠打, 14併殺打, 15出塁率, 16長打率,
            // 17OPS, 18RC27, 19XR27
            const avg = row[2] || null;
            const g = toNumber(row[3]);
            const pa = toNumber(row[4]);
            const ab = toNumber(row[5]);
            const h = toNumber(row[6]);
            const hr = toNumber(row[7]);
            const rbi = toNumber(row[8]);
            const sb = toNumber(row[9]);
            const bb = toNumber(row[10]);
            const hbp = toNumber(row[11]);
            const k = toNumber(row[12]);
            const obp = row[15] || null;
            const slg = row[16] || null;
            const ops = row[17] || null;
            const slgNumber = toNumber(slg);

            const tb =
              slgNumber !== null && ab !== null
                ? Math.round(slgNumber * ab)
                : null;

            return {
              target_table: "season_stats",
              player_id: playerId,
              season_year: params.seasonYear,
              league: params.league,
              level: params.level,
              stat_type: "batting",
              team_name: params.teamName || "未判定球隊",

              g,
              pa,
              ab,
              r: null,
              h,
              tb,
              doubles: null,
              triples: null,
              hr,
              rbi,
              bb,
              ibb: null,
              hbp,
              k,
              sb,
              cs: null,
              sf: null,
              go_ao: null,

              official_avg: avg,
              official_obp: obp,
              official_slg: slg,
              official_ops: ops,
              official_k_rate: ratePercent(k, pa),
              official_bb_rate: ratePercent(bb, pa),
              official_babip: null,
            };
          });
      });
    }



    function parseKboSeasonStats(params: {
      tablePreview: any[];
      playerId: string;
      playerName?: string | null;
      teamName: string | null;
      statType: string;
      level: string | null;
      seasonYear: number;
    }) {
      const isPitching = params.statType === "pitching";
      const selectedNames = [
        params.playerName,
        body.selectedPlayerNameJa,
        body.selectedPlayerNameKo,
        body.name_ko,
      ]
        .map(normalizeText)
        .filter(Boolean);

      return params.tablePreview.flatMap((table: any): any[] => {
        const headers = table.headers ?? [];

        const matchedRows = table.rows
          .filter((row: string[]) => {
            if (!selectedNames.length) return false;

            const nameCell = normalizeText(
              getCellByAliases(headers, row, ["선수명", "선수", "選手名", "Player", "Name"]) ||
                row[1] ||
                row[0]
            );
            const joinedRow = normalizeText(row.join(" "));

            return selectedNames.some((name) => {
              return (
                nameCell.includes(name) ||
                joinedRow.includes(name) ||
                name.includes(nameCell)
              );
            });
          })
          .map((row: string[]) => ({
            row,
            playerId: params.playerId,
          }));

        if (isPitching) {
          const safeHeaders = (headers ?? []).map((h: any) => normalizeText(h));

          const looksLikeKboBasicPitching =
            safeHeaders.includes("팀명") &&
            safeHeaders.includes("ERA") &&
            safeHeaders.includes("G") &&
            safeHeaders.includes("TBF") &&
            safeHeaders.includes("NP") &&
            safeHeaders.includes("IP");

          if (!looksLikeKboBasicPitching) return [];

          const basicTable = table;

          const extraTable = params.tablePreview.find((candidate: any) => {
            const h = candidate.headers ?? [];
            const normalizedHeaders = h.map((value: any) => normalizeText(value));

            return (
              normalizedHeaders.includes("SAC") &&
              normalizedHeaders.includes("SF") &&
              normalizedHeaders.includes("BB") &&
              normalizedHeaders.includes("IBB") &&
              normalizedHeaders.includes("SO") &&
              normalizedHeaders.includes("WHIP") &&
              normalizedHeaders.includes("AVG")
            );
          });

          const rowA = basicTable.rows?.[0];
          const rowB = extraTable?.rows?.[0] ?? [];

          if (!rowA) return [];

          const ip = rowA[12] || null;
          const innings = ipToInnings(ip);

          const h = toNumber(rowA[13]);
          const hr = toNumber(rowA[16]);

          const bb = toNumber(rowB[2]);
          const ibb = toNumber(rowB[3]);
          const k = toNumber(rowB[4]);
          const hbp = null;
          const r = toNumber(rowB[7]);
          const er = toNumber(rowB[8]);

          const era =
            innings !== null && innings > 0 && er !== null
              ? roundTo((er * 9) / innings, 2)
              : rowA[1] || null;

          const whip =
            innings !== null && innings > 0 && h !== null && bb !== null
              ? roundTo((h + bb) / innings, 2)
              : rowB[10] || null;

          return [
            {
              target_table: "season_stats",
              player_id: params.playerId,
              season_year: params.seasonYear,
              league: "韓職",
              level: params.level || "韓職一軍",
              stat_type: "pitching",
              team_name: params.teamName || rowA[0] || "未判定球隊",

              era,
              g: toNumber(rowA[2]),
              cg: toNumber(rowA[3]),
              sho: toNumber(rowA[4]),
              win: toNumber(rowA[5]),
              loss: toNumber(rowA[6]),
              save: toNumber(rowA[7]),
              hold: toNumber(rowA[8]),
              svo: null,

              bf: toNumber(rowA[10]),
              pitch_count: toNumber(rowA[11]),
              ip,
              h,
              r,
              er,
              hr,

              bb,
              ibb,
              hbp,
              k,

              official_avg: rowB[11] || null,
              whip,
              go_ao: null,

              gs: null,
            },
          ];
        }

        const looksLikeBatting = headers.some((h: string) =>
          ["AVG", "타율", "打率"].includes(normalizeText(h))
        ) && headers.some((h: string) =>
          ["AB", "타수", "打數", "打数"].includes(normalizeText(h))
        );

        if (!looksLikeBatting) return [];

        return matchedRows.map(({ row, playerId }: { row: string[]; playerId: string }) => {
          const g = toNumber(getCellByAliases(headers, row, ["G", "경기", "試合", "出賽"]));
          const pa = toNumber(getCellByAliases(headers, row, ["PA", "타석", "打席"]));
          const ab = toNumber(getCellByAliases(headers, row, ["AB", "타수", "打數", "打数"]));
          const r = toNumber(getCellByAliases(headers, row, ["R", "득점", "得分", "得点"]));
          const h = toNumber(getCellByAliases(headers, row, ["H", "안타", "安打"]));
          const doubles = toNumber(getCellByAliases(headers, row, ["2B", "2루타", "二壘安打", "二塁打"]));
          const triples = toNumber(getCellByAliases(headers, row, ["3B", "3루타", "三壘安打", "三塁打"]));
          const hr = toNumber(getCellByAliases(headers, row, ["HR", "홈런", "全壘打", "本塁打"]));
          const rbi = toNumber(getCellByAliases(headers, row, ["RBI", "타점", "打點", "打点"]));
          const bb = toNumber(getCellByAliases(headers, row, ["BB", "볼넷", "四壞球", "四球", "保送"]));
          const ibb = toNumber(getCellByAliases(headers, row, ["IBB", "고의4구", "故意四壞"]));
          const hbp = toNumber(getCellByAliases(headers, row, ["HBP", "사구", "觸身球", "死球"]));
          const k = toNumber(getCellByAliases(headers, row, ["SO", "K", "삼진", "三振"]));
          const sb = toNumber(getCellByAliases(headers, row, ["SB", "도루", "盜壘", "盗塁"]));
          const cs = toNumber(getCellByAliases(headers, row, ["CS", "도실", "盜壘失敗", "盗塁死"]));
          const sf = toNumber(getCellByAliases(headers, row, ["SF", "희비", "高飛犧牲打", "犠飛"]));

          const officialSlg = getCellByAliases(headers, row, ["SLG", "장타율", "長打率"]);
          const slgNumber = toNumber(officialSlg);
          const tb =
            toNumber(getCellByAliases(headers, row, ["TB", "루타", "壘打數", "塁打数"])) ??
            (h !== null && doubles !== null && triples !== null && hr !== null
              ? h + doubles + triples * 2 + hr * 3
              : slgNumber !== null && ab !== null
              ? Math.round(slgNumber * ab)
              : null);

          const avg = rate3(h, ab);
          const obp = rate3(
            h !== null && bb !== null && hbp !== null ? h + bb + hbp : null,
            ab !== null && bb !== null && hbp !== null && sf !== null
              ? ab + bb + hbp + sf
              : null
          );
          const slg = rate3(tb, ab);
          const ops =
            obp !== null && slg !== null
              ? (Number(obp) + Number(slg)).toFixed(3).replace(/^0/, "")
              : getCellByAliases(headers, row, ["OPS"]);
          const babip = rate3(
            h !== null && hr !== null ? h - hr : null,
            ab !== null && k !== null && hr !== null && sf !== null
              ? ab - k - hr + sf
              : null
          );

          return {
            target_table: "season_stats",
            player_id: playerId,
            season_year: params.seasonYear,
            league: "韓職",
            level: params.level || "韓職一軍",
            stat_type: "batting",
            team_name:
              getCellByAliases(headers, row, ["팀", "팀명", "Team", "球隊", "チーム"]) ||
              params.teamName ||
              "未判定球隊",

            g,
            pa,
            ab,
            r,
            h,
            tb,
            doubles,
            triples,
            hr,
            rbi,
            bb,
            ibb,
            hbp,
            k,
            sb,
            cs,
            sf,
            go_ao: null,

            official_avg: avg,
            official_obp: obp,
            official_slg: slg,
            official_ops: ops,
            official_k_rate: ratePercent(k, pa),
            official_bb_rate: ratePercent(bb, pa),
            official_babip: babip,
          };
        });
      });
    }

    if (
      leagueType === "NPB" &&
      sourceType === "season_stats" &&
      body.statType === "batting" &&
      url.includes("pacificleague.com/player")
    ) {
      const seasonStatsPreview = parsePacificLeagueSeasonStats({
        tablePreview,
        playerId,
        teamName: inputTeamName,
        level: inputLevel,
        seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
        statType: body.statType || "batting",
      });

      return NextResponse.json({
        ok: true,
        title,
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview,
        transactionsPreview: [],
        gameLogsPreview: [],
        tables: tablePreview,
      });
    }

    if (
      leagueType === "NPB" &&
      sourceType === "game_logs" &&
      url.includes("pacificleague.com/player")
    ) {
      const gameLogsPreview =
        body.statType === "pitching"
          ? parsePacificLeaguePitchingGameLogs({
              $,
              playerId,
              teamName: inputTeamName,
              level: inputLevel,
              seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
            })
          : parsePacificLeagueBattingGameLogs({
              $,
              playerId,
              teamName: inputTeamName,
              level: inputLevel,
              seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
            });

      return NextResponse.json({
        ok: true,
        title,
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview: [],
        transactionsPreview: [],
        gameLogsPreview,
        tables: tablePreview,
      });
    }

    if (
      leagueType === "NPB" &&
      sourceType === "season_stats" &&
      url.includes("baseball-data.com")
    ) {
      const seasonStatsPreview = parseBaseballDataFarmSeasonStats({
        tablePreview,
        playerId,
        players,
        playerName: body.playerName || body.name_zh || null,
        teamName: inputTeamName,
        statType: body.statType || "batting",
        league: "日職",
        level: inputLevel || "日職二軍",
        seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
      });
      return NextResponse.json({
        ok: true,
        title,
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview,
        transactionsPreview: [],
        gameLogsPreview: [],
        tables: tablePreview,
      });
    }


    if (
      leagueType === "KBO" &&
      sourceType === "season_stats"
    ) {
      const seasonStatsPreview = parseKboSeasonStats({
        tablePreview,
        playerId,
        playerName: body.playerName || body.name_zh || body.name_en || null,
        teamName: inputTeamName,
        statType: body.statType || "batting",
        level: inputLevel || "韓職一軍",
        seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
      });

      return NextResponse.json({
        ok: true,
        title,
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview,
        transactionsPreview: [],
        gameLogsPreview: [],
        tables: tablePreview,
      });
    }

    const detectedTeamName =
      inputTeamName || convertMlbTeamFromTitle(title) || "未判定球隊";

    if (
      (leagueType === "NPB" || leagueType === "KBO") &&
      sourceType === "game_logs"
    ) {
      const gameLogsPreview = parseNpbKboGameLogs({
        tablePreview,
        playerId,
        statType: body.statType || "batting",
        leagueType,
        teamName: inputTeamName,
        level: inputLevel,
        seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
      });

      return NextResponse.json({
        ok: true,
        title,
        htmlLength: html.length,
        detectedTeamName: inputTeamName || null,
        seasonStatsPreview: [],
        transactionsPreview: [],
        gameLogsPreview,
        tables: tablePreview,
      });
    }

    const seasonStatsPreview = tablePreview
      .filter((table) => {
        const headers = Array.isArray(table.headers) ? table.headers : [];

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
        const headers = Array.isArray(table.headers) ? table.headers : [];

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
          (Array.isArray(table.headers) ? table.headers : []).includes("Date") &&
          (Array.isArray(table.headers) ? table.headers : []).includes("Transaction")
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