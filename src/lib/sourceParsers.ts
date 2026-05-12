type ParseSourcePreviewInput = {
  playerId: string;
  playerNameZh?: string;
  playerNameEn?: string | null;
  sourceType:
    | "game_logs"
    | "season_stats"
    | "latest_transactions"
    | "mlb_pipeline"
    | "fangraphs_scouting";
  sourceInput: string;
};

export async function parseSourcePreview(input: ParseSourcePreviewInput) {
  switch (input.sourceType) {
    case "game_logs":
      return parseGameLogs(input);
    case "season_stats":
      return parseSeasonStats(input);
    case "latest_transactions":
      return parseLatestTransactions(input);
    case "mlb_pipeline":
      return parseMlbPipelineScouting(input);
    case "fangraphs_scouting":
      return parseFangraphsScouting(input);
    default:
      return [];
  }
}

function parseGameLogs(input: ParseSourcePreviewInput) {
  return [
    {
      target_table: "daily_reports",
      status: "todo",
      message: "下一步接 Game Logs parser，輸出 daily_reports 格式",
      player_id: input.playerId,
      source_input_preview: input.sourceInput.slice(0, 200),
    },
  ];
}

function parseSeasonStats(input: ParseSourcePreviewInput) {
  const lines = input.sourceInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rowMap = new Map<string, any>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const isHeader =
      line.startsWith("Season") &&
      line.includes("Team") &&
      line.includes("LG");

    if (!isHeader) continue;

    const headers = line.split(/\t+/).map((v) => v.trim());

    const isPitchingMain =
      headers.includes("ERA") &&
      headers.includes("IP") &&
      headers.includes("WHIP");

    const isBattingMain =
      headers.includes("AB") &&
      headers.includes("OPS") &&
      headers.includes("AVG");

    const isBattingAdvanced =
      headers.includes("PA") &&
      headers.includes("BABIP") &&
      headers.includes("HBP");

    const isPitchingAdvanced =
      headers.includes("K/9") &&
      headers.includes("BB/9") &&
      headers.includes("HR/9") &&
      headers.includes("K/BB");

    for (const dataLine of lines.slice(i + 1)) {
      if (
        dataLine.startsWith("Season") ||
        dataLine.startsWith("Career Stats") ||
        dataLine.startsWith("Advanced Career Stats")
      ) {
        break;
      }

      const values = dataLine.split(/\t+/).map((v) => v.trim());
      if (values.length < 5) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });

      if (!row.Season || row.Team === "-" || row.Season.includes("Career")) {
        continue;
      }

      const season = Number(row.Season);
      const teamName = convertMlbTeam(row.Team);
      const statType = isPitchingMain || isPitchingAdvanced ? "pitching" : "batting";
      const key = `${season}-${teamName}-${statType}`;

      if (isBattingMain) {
        rowMap.set(key, {
          target_table: "season_stats",
          player_id: input.playerId,
          season_year: season,
          team_name: teamName,
          level: "MLB",
          stat_type: "batting",

          g: numberOrNull(row.G),
          pa: null,
          ab: numberOrNull(row.AB),
          r: numberOrNull(row.R),
          h: numberOrNull(row.H),
          tb: numberOrNull(row.TB),
          doubles: numberOrNull(row["2B"]),
          triples: numberOrNull(row["3B"]),
          hr: numberOrNull(row.HR),
          rbi: numberOrNull(row.RBI),
          bb: numberOrNull(row.BB),
          ibb: numberOrNull(row.IBB),
          hbp: null,
          k: numberOrNull(row.SO),
          sb: numberOrNull(row.SB),
          cs: numberOrNull(row.CS),
          sf: null,

          official_avg: row.AVG || null,
          official_obp: row.OBP || null,
          official_slg: row.SLG || null,
          official_ops: row.OPS || null,
          go_ao: numberOrNull(row["GO/AO"]),
        });

        continue;
      }

      if (isPitchingMain) {
        rowMap.set(key, {
          target_table: "season_stats",
          player_id: input.playerId,
          season_year: season,
          team_name: teamName,
          level: "MLB",
          stat_type: "pitching",

          win: numberOrNull(row.W),
          loss: numberOrNull(row.L),
          era: row.ERA || null,
          g: numberOrNull(row.G),
          gs: numberOrNull(row.GS),
          cg: numberOrNull(row.CG),
          sho: numberOrNull(row.SHO),
          hold: numberOrNull(row.HLD),
          save: numberOrNull(row.SV),
          svo: numberOrNull(row.SVO),
          ip_outs: ipToOuts(row.IP),
          h: numberOrNull(row.H),
          r: numberOrNull(row.R),
          er: numberOrNull(row.ER),
          hr: numberOrNull(row.HR),
          pitch_count: numberOrNull(row.NP),
          hbp: numberOrNull(row.HB ?? row.HBP),
          bb: numberOrNull(row.BB),
          ibb: numberOrNull(row.IBB),
          k: numberOrNull(row.SO),
          official_avg: row.AVG || null,
          official_whip: row.WHIP || null,
          go_ao: numberOrNull(row["GO/AO"]),
        });

        continue;
      }

      const existing = rowMap.get(key);
      if (!existing) continue;

      if (isBattingAdvanced && existing.stat_type === "batting") {
        rowMap.set(key, {
          ...existing,
          pa: numberOrNull(row.PA),
          hbp: numberOrNull(row.HBP),
          sf: numberOrNull(row.SF),
          official_babip: row.BABIP || null,
        });

        continue;
      }

      if (isPitchingAdvanced && existing.stat_type === "pitching") {
        rowMap.set(key, {
          ...existing,
          k9: numberOrNull(row["K/9"]),
          bb9: numberOrNull(row["BB/9"]),
          hr9: numberOrNull(row["HR/9"]),
          h9: numberOrNull(row["H/9"]),
          kbb: numberOrNull(row["K/BB"]),
        });
      }
    }
  }

  const rows = Array.from(rowMap.values());

  if (!rows.length) {
    return [
      {
        target_table: "season_stats",
        status: "error",
        message: "沒有解析到可用的 season_stats 資料",
      },
    ];
  }

  return rows;
}

function parseLatestTransactions(input: ParseSourcePreviewInput) {
  return [
    {
      target_table: "player_events",
      status: "todo",
      message: "下一步接 Transactions parser，輸出 player_events 格式",
      player_id: input.playerId,
      source_input_preview: input.sourceInput.slice(0, 200),
    },
  ];
}

function parseMlbPipelineScouting(input: ParseSourcePreviewInput) {
  return [
    {
      target_table: "player_scouting_reports",
      source: "MLB Pipeline",
      status: "todo",
      message: "下一步解析 MLB Pipeline scouting grades/report",
      player_id: input.playerId,
      source_input_preview: input.sourceInput.slice(0, 200),
    },
  ];
}

function parseFangraphsScouting(input: ParseSourcePreviewInput) {
  return [
    {
      target_table: "player_scouting_reports",
      source: "FanGraphs",
      status: "todo",
      message: "下一步解析 FanGraphs scouting report",
      player_id: input.playerId,
      source_input_preview: input.sourceInput.slice(0, 200),
    },
  ];
}

function numberOrNull(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === ".---") return null;

  const n = Number(raw.replace("%", ""));
  return Number.isFinite(n) ? n : null;
}

function ipToOuts(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return null;

  const [wholeText, decimalText = "0"] = raw.split(".");
  const whole = Number(wholeText);
  const decimal = Number(decimalText);

  if (!Number.isFinite(whole)) return null;

  return whole * 3 + (decimal === 1 ? 1 : decimal === 2 ? 2 : 0);
}

function convertMlbTeam(code: string) {
  const map: Record<string, string> = {
    AZ: "響尾蛇",
    ARI: "響尾蛇",
    HOU: "太空人",
    SF: "巨人",
    SFG: "巨人",
    DET: "老虎",
    BOS: "紅襪",
    LAD: "道奇",
    CHC: "小熊",
    NYY: "洋基",
    SEA: "水手",
    OAK: "運動家",
    ATH: "運動家",
    PIT: "海盜",
    PHI: "費城人",
    CLE: "守護者",
    CIN: "紅人",
    BAL: "金鶯",
    MIL: "釀酒人",
    SD: "教士",
    SDP: "教士",
    NYM: "大都會",
    TOR: "藍鳥",
    CWS: "白襪",
    CHW: "白襪",
    ATL: "勇士",
    COL: "洛磯",
    STL: "紅雀",
    LAA: "天使",
    TEX: "遊騎兵",
    KC: "皇家",
    KCR: "皇家",
    TB: "光芒",
    TBR: "光芒",
    MIN: "雙城",
    WSH: "國民",
    MIA: "馬林魚",
  };

  return map[code] || code;
}