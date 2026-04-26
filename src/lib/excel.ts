import "server-only";

import * as XLSX from "xlsx";
import path from "node:path";
import { readFile } from "node:fs/promises";
type ExcelCellValue = string | number | boolean | null | undefined;

type ExcelRow = Record<string, ExcelCellValue>;

export type Player = {
  name: string;
  type: string;
  league: string;
  team: string;
  level: string;
  movement: string;
  status: string;
  lastStart?: string;
  expectedStart?: string;
  identity?: string;
  note?: string;
};

export type TodayReport = {
  date: string;
  name: string;
  type: string;
  league: string;
  team: string;
  level: string;
  result: string;
  opponent: string;
  stats: string;
};

function valueToString(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function getRowValue(row: Record<string, unknown>, possibleKeys: string[]) {
  const matchedKey = Object.keys(row).find((key) =>
    possibleKeys.includes(key.trim())
  );

  if (!matchedKey) return "";

  return valueToString(row[matchedKey]);
}

export async function getExcelWorkbook() {
  const filePath = path.join(process.cwd(), "data", "yyds.xlsx");
  const fileBuffer = await readFile(filePath);

  return XLSX.read(fileBuffer, { type: "buffer" });
}

export async function getPlayersFromExcel(): Promise<Player[]> {
  const workbook = await getExcelWorkbook();
  const sheet = workbook.Sheets["總表"];

  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  return rows.map((row) => ({
    name: getRowValue(row, ["球員", "姓名", "name"]),
    type: getRowValue(row, ["守位", "位置", "守備位置", "球員類型", "類型", "type"]),
    league: getRowValue(row, ["分類", "聯盟", "league"]),
    team: getRowValue(row, ["球隊", "team"]),
    level: getRowValue(row, ["層級", "等級", "level"]),
    movement: getRowValue(row, ["升降", "異動", "movement"]),
    status: getRowValue(row, ["狀態", "status"]),
    lastStart: getRowValue(row, ["上次先發", "lastStart"]),
    expectedStart: getRowValue(row, ["預期先發", "expectedStart"]),
    identity: getRowValue(row, ["身分", "identity"]),
    note: getRowValue(row, ["狀態異動", "傷病", "備註", "note"]),
  }));
}

export async function getTodayReportsFromExcel(): Promise<TodayReport[]> {
  const workbook = await getExcelWorkbook();
  const sheet =
    workbook.Sheets["今日戰報"] ||
    workbook.Sheets["今日出賽"];

  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<ExcelCellValue[]>(sheet, {
    header: 1,
    defval: "",
  });

  const headerRowIndex = rows.findIndex((row) => {
    const firstCell = valueToString(row[0]);
    const secondCell = valueToString(row[1]);

    return firstCell === "球員" || firstCell === "日期" || secondCell === "球員";
  });

  if (headerRowIndex === -1) return [];

  const headerRow = rows[headerRowIndex];
  const hasDateColumn =
    valueToString(headerRow[0]) === "日期" &&
    valueToString(headerRow[1]) === "球員";

  const dataRows = rows.slice(headerRowIndex + 1);

  const reports = dataRows.map((row) => {
    const date = hasDateColumn ? valueToString(row[0]) : "";

    const name = hasDateColumn ? valueToString(row[1]) : valueToString(row[0]);
    const category = hasDateColumn ? valueToString(row[2]) : valueToString(row[1]);
    const level = hasDateColumn ? valueToString(row[3]) : valueToString(row[2]);
    const position = hasDateColumn ? valueToString(row[4]) : valueToString(row[3]);
    const team = hasDateColumn ? valueToString(row[5]) : valueToString(row[4]);
    const result = hasDateColumn ? valueToString(row[6]) : valueToString(row[5]);
    const opponent = hasDateColumn ? valueToString(row[7]) : valueToString(row[6]);
    const stats = hasDateColumn ? valueToString(row[8]) : valueToString(row[7]);

    return {
      date,
      name,
      type: position,
      league:
        category === "旅美"
          ? "MiLB"
          : category === "旅日"
          ? "NPB"
          : category === "旅韓"
          ? "KBO"
          : category === "台裔"
          ? "MLB"
          : category,
      team,
      level,
      result,
      opponent: opponent || "-",
      stats: stats || "-",
    };
  });

  return reports.filter((report) => {
    if (!report.name) return false;
    if (report.name === "球員") return false;
    if (report.name === "投手" || report.name === "野手") return false;

    return report.stats !== "" && report.stats !== "-";
  });
}

export async function getTodayReports(): Promise<ExcelRow[]> {
  const workbook = await getExcelWorkbook();

  const sheet = workbook.Sheets["今日戰報"];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    defval: "",
  });

  return rows.filter((row) => {
    const todayResult =
      row["今日成績"] ||
      row["成績"] ||
      row["打擊成績"] ||
      row["投球成績"] ||
      "";

    return String(todayResult).trim() !== "";
  });
}
export async function getPlayers(): Promise<ExcelRow[]> {
  const workbook = await getExcelWorkbook();

  const sheet =
    workbook.Sheets["總表"] ||
    workbook.Sheets["球員總表"] ||
    workbook.Sheets["players"];

  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    defval: "",
  });

  return rows;
}