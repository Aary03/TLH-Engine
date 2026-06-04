/**
 * Voguestock × Valura — co-branded tax document generator.
 * Produces colourful, professional .xlsx files client-side via exceljs.
 */
import type { Workbook, Worksheet } from "exceljs";
import {
  Client, USD_INR, FY_LABEL, FY_START, FY_END,
  isLongTerm, holdingDays, clientTotals, quarterOf, type AssetType,
} from "./clients";

export type DocType = "pnl" | "dividend" | "holdings" | "fsi" | "tr" | "form67";

/* ── Brand palette (ARGB) ── */
const ORANGE = "FFE0822E";   // Voguestock
const GREEN = "FF05A049";    // Valura
const NAVY = "FF00111B";
const GREEN_SOFT = "FFEDFAF3";
const ORANGE_SOFT = "FFFCEFE0";
const GREY = "FF6B7280";
const ROW_ALT = "FFF7FAF8";
const WHITE = "FFFFFFFF";
const BORDER = "FFE5E7EB";

const money = '#,##0;[Red]-#,##0';

function thin() {
  return {
    top: { style: "thin" as const, color: { argb: BORDER } },
    left: { style: "thin" as const, color: { argb: BORDER } },
    bottom: { style: "thin" as const, color: { argb: BORDER } },
    right: { style: "thin" as const, color: { argb: BORDER } },
  };
}

function brandHeader(ws: Worksheet, lastCol: number, docTitle: string, subtitle: string, client: Client) {
  const colLetter = ws.getColumn(lastCol).letter;

  // Row 1 — co-brand banner
  ws.mergeCells(`A1:${colLetter}1`);
  const banner = ws.getCell("A1");
  banner.value = {
    richText: [
      { text: "Voguestock ", font: { bold: true, size: 18, color: { argb: ORANGE }, name: "Calibri" } },
      { text: "× ", font: { bold: true, size: 18, color: { argb: WHITE } } },
      { text: "Valura", font: { bold: true, size: 18, color: { argb: GREEN } } },
    ],
  };
  banner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  banner.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 32;

  // Row 2 — document title
  ws.mergeCells(`A2:${colLetter}2`);
  const t = ws.getCell("A2");
  t.value = docTitle;
  t.font = { bold: true, size: 14, color: { argb: NAVY } };
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(2).height = 24;

  // Row 3 — subtitle
  ws.mergeCells(`A3:${colLetter}3`);
  const s = ws.getCell("A3");
  s.value = subtitle;
  s.font = { italic: true, size: 10, color: { argb: GREY } };
  s.alignment = { indent: 1 };

  // Row 4 — client strip
  ws.mergeCells(`A4:${colLetter}4`);
  const c = ws.getCell("A4");
  c.value = {
    richText: [
      { text: "Client: ", font: { color: { argb: GREY }, size: 10 } },
      { text: `${client.name}`, font: { bold: true, color: { argb: NAVY }, size: 10 } },
      { text: "    PAN: ", font: { color: { argb: GREY }, size: 10 } },
      { text: `${client.pan}`, font: { bold: true, color: { argb: NAVY }, size: 10 } },
      { text: "    Period: ", font: { color: { argb: GREY }, size: 10 } },
      { text: FY_LABEL, font: { bold: true, color: { argb: NAVY }, size: 10 } },
    ],
  };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_SOFT } };
  c.alignment = { indent: 1, vertical: "middle" };
  ws.getRow(4).height = 20;
  ws.getRow(5).height = 6; // spacer
}

function tableHead(ws: Worksheet, row: number, headers: string[]) {
  const r = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = r.getCell(i + 1);
    cell.value = h;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", wrapText: true, indent: i === 0 ? 1 : 0 };
    cell.border = thin();
  });
  r.height = 30;
}

function dataRow(ws: Worksheet, row: number, values: (string | number)[], opts?: { alt?: boolean; moneyCols?: number[]; boldCols?: number[] }) {
  const r = ws.getRow(row);
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.border = thin();
    cell.font = { size: 10, color: { argb: NAVY }, bold: opts?.boldCols?.includes(i) };
    cell.alignment = { vertical: "middle", horizontal: typeof v === "number" || i > 0 ? "right" : "left", indent: i === 0 ? 1 : 0 };
    if (opts?.moneyCols?.includes(i)) cell.numFmt = money;
    if (opts?.alt) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROW_ALT } };
  });
}

function totalRow(ws: Worksheet, row: number, values: (string | number)[], moneyCols: number[]) {
  const r = ws.getRow(row);
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_SOFT } };
    cell.font = { bold: true, size: 10, color: { argb: NAVY } };
    cell.border = thin();
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
    if (moneyCols.includes(i)) cell.numFmt = money;
  });
  r.height = 20;
}

function disclaimer(ws: Worksheet, startRow: number, lastCol: number) {
  const colLetter = ws.getColumn(lastCol).letter;
  const lines = [
    "Disclaimer — illustrative co-branded report generated by Voguestock × Valura.",
    "USD→INR converted at the SBI TT buying rate (₹83.5 demo rate). Confirm the applicable rate with your tax advisor.",
    "Prepared from the trades & information available at the time of generation. Consult your CA before filing.",
    "No warranty, express or implied, on completeness. Tax law is subject to change, at times retrospectively.",
  ];
  lines.forEach((l, i) => {
    const row = startRow + i;
    ws.mergeCells(`A${row}:${colLetter}${row}`);
    const cell = ws.getCell(`A${row}`);
    cell.value = (i === 0 ? "" : "•  ") + l;
    cell.font = { italic: true, size: 8.5, color: { argb: GREY }, bold: i === 0 };
    cell.alignment = { indent: 1 };
  });
}

function summaryBand(ws: Worksheet, row: number, lastCol: number, pairs: [string, string][]) {
  // one merged band of "Label: value   Label: value" chips
  const colLetter = ws.getColumn(lastCol).letter;
  ws.mergeCells(`A${row}:${colLetter}${row}`);
  const cell = ws.getCell(`A${row}`);
  const rt: { text: string; font: any }[] = [];
  pairs.forEach(([k, v], i) => {
    if (i) rt.push({ text: "       ", font: { size: 10 } });
    rt.push({ text: `${k}: `, font: { size: 10, color: { argb: GREY } } });
    rt.push({ text: v, font: { size: 11, bold: true, color: { argb: NAVY } } });
  });
  cell.value = { richText: rt };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE_SOFT } };
  cell.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(row).height = 22;
}

function sectionRow(ws: Worksheet, row: number, lastCol: number, text: string) {
  const colLetter = ws.getColumn(lastCol).letter;
  ws.mergeCells(`A${row}:${colLetter}${row}`);
  const cell = ws.getCell(`A${row}`);
  cell.value = text;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  cell.font = { bold: true, size: 10, color: { argb: WHITE } };
  cell.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(row).height = 20;
}

const fmtINR = (n: number) => (Math.abs(n) >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : Math.abs(n) >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${n.toLocaleString("en-IN")}`);

/* ════════════════ document builders ════════════════ */

function buildHoldings(wb: Workbook, c: Client) {
  const ws = wb.addWorksheet("Holdings");
  ws.columns = [{ width: 30 }, { width: 11 }, { width: 8 }, { width: 16 }, { width: 8 }, { width: 13 }, { width: 12 }, { width: 14 }, { width: 15 }, { width: 16 }, { width: 11 }, { width: 10 }];
  const LAST = 12;
  brandHeader(ws, LAST, "Holdings Statement", "Current global holdings as on 31 Mar 2026 — your Schedule FA reference", c);
  const t = clientTotals(c);
  summaryBand(ws, 6, LAST, [["Positions", String(c.holdings.length)], ["Invested", fmtINR(t.holdingsCostINR)], ["Current value", fmtINR(t.holdingsValueINR)], ["Unrealised P&L", fmtINR(t.unrealisedINR)]]);
  tableHead(ws, 7, ["Security", "Ticker", "Type", "ISIN", "Qty", "Avg cost (USD)", "Price (USD)", "Cost (₹)", "Value (₹)", "Unreal. P&L (₹)", "Unreal. %", "Weight %"]);

  const total = c.holdings.reduce((s, h) => s + h.curUSD * h.qty, 0);
  let row = 8;
  const types: AssetType[] = ["Stock", "ETF", "Fund"];
  for (const type of types) {
    const group = c.holdings.filter((h) => h.type === type);
    if (!group.length) continue;
    sectionRow(ws, row++, LAST, `${type === "Stock" ? "Direct Stocks" : type === "ETF" ? "ETFs" : "Mutual Funds / FoFs"} (${group.length})`);
    let subVal = 0, subCost = 0, subPnl = 0;
    group.forEach((h, i) => {
      const costINR = Math.round(h.buyUSD * h.qty * USD_INR);
      const valueINR = Math.round(h.curUSD * h.qty * USD_INR);
      const pnlINR = valueINR - costINR;
      const pnlPct = ((h.curUSD - h.buyUSD) / h.buyUSD) * 100;
      const weight = (h.curUSD * h.qty / total) * 100;
      subVal += valueINR; subCost += costINR; subPnl += pnlINR;
      dataRow(ws, row++, [h.security, h.ticker, h.type, h.isin, h.qty, h.buyUSD, h.curUSD, costINR, valueINR, pnlINR, `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%`, `${weight.toFixed(1)}%`], { alt: i % 2 === 1, moneyCols: [7, 8, 9] });
    });
    totalRow(ws, row++, [`${type} subtotal`, "", "", "", "", "", "", subCost, subVal, subPnl, "", ""], [7, 8, 9]);
  }
  totalRow(ws, row++, ["GRAND TOTAL", "", "", "", "", "", "", t.holdingsCostINR, t.holdingsValueINR, t.unrealisedINR, "", "100%"], [7, 8, 9]);
  disclaimer(ws, row + 1, LAST);
}

function buildPnL(wb: Workbook, c: Client) {
  const ws = wb.addWorksheet("Tax P&L");
  ws.columns = [{ width: 28 }, { width: 10 }, { width: 11 }, { width: 11 }, { width: 7 }, { width: 11 }, { width: 11 }, { width: 14 }, { width: 14 }, { width: 15 }, { width: 8 }, { width: 9 }];
  const LAST = 12;
  brandHeader(ws, LAST, "Capital Gains — Tax P&L Statement", "Realised gains on foreign securities · STCG ≤ 24m at slab, LTCG > 24m at 12.5%", c);
  const t = clientTotals(c);
  summaryBand(ws, 6, LAST, [["Trades", String(c.sales.length)], ["STCG", fmtINR(t.stcgINR)], ["LTCG", fmtINR(t.ltcgINR)], ["Net gains", fmtINR(t.capGainsINR)]]);
  const head = ["Security", "Ticker", "Buy date", "Sell date", "Qty", "Buy (USD)", "Sell (USD)", "Cost (₹)", "Proceeds (₹)", "Gain / Loss (₹)", "Days", "Type"];

  let row = 7;
  const render = (lt: boolean, label: string) => {
    const group = c.sales.filter((s) => isLongTerm(s.buyDate, s.sellDate) === lt);
    if (!group.length) return;
    sectionRow(ws, row++, LAST, label);
    tableHead(ws, row++, head);
    let sub = 0;
    group.forEach((s, i) => {
      const costINR = Math.round(s.buyUSD * s.qty * USD_INR);
      const procINR = Math.round(s.sellUSD * s.qty * USD_INR);
      const gainINR = procINR - costINR;
      sub += gainINR;
      dataRow(ws, row++, [s.security, s.ticker, s.buyDate, s.sellDate, s.qty, s.buyUSD, s.sellUSD, costINR, procINR, gainINR, holdingDays(s.buyDate, s.sellDate), lt ? "LTCG" : "STCG"], { alt: i % 2 === 1, moneyCols: [7, 8, 9] });
    });
    totalRow(ws, row++, [`${lt ? "LTCG" : "STCG"} subtotal`, "", "", "", "", "", "", "", "", sub, "", ""], [9]);
    ws.getRow(row++).height = 6;
  };
  render(false, "Short-Term Capital Gains  ·  taxed at your slab rate");
  render(true, "Long-Term Capital Gains  ·  taxed at 12.5% (no indexation)");
  totalRow(ws, row++, ["NET CAPITAL GAINS (STCG + LTCG)", "", "", "", "", "", "", "", "", t.capGainsINR, "", ""], [9]);
  disclaimer(ws, row + 1, LAST);
}

function buildDividend(wb: Workbook, c: Client) {
  const ws = wb.addWorksheet("Dividends");
  ws.columns = [{ width: 30 }, { width: 11 }, { width: 12 }, { width: 15 }, { width: 13 }, { width: 13 }, { width: 14 }, { width: 13 }, { width: 14 }, { width: 9 }];
  const LAST = 10;
  brandHeader(ws, LAST, "Dividend Report", "Foreign dividends & US withholding tax (25%) — recover via Form 67 (FTC)", c);
  const t = clientTotals(c);
  const paying = c.dividends.filter((d) => d.grossUSD > 0);
  summaryBand(ws, 6, LAST, [["Payouts", String(paying.length)], ["Gross", fmtINR(t.divGrossINR)], ["US tax withheld", fmtINR(t.usTaxINR)], ["Net received", fmtINR(t.divGrossINR - t.usTaxINR)]]);
  tableHead(ws, 7, ["Security", "Ticker", "Pay date", "Quarter", "Gross (USD)", "US tax (USD)", "Gross (₹)", "US tax (₹)", "Net (₹)", "Eff. rate"]);
  let row = 8;
  paying.forEach((d, i) => {
    const grossINR = Math.round(d.grossUSD * USD_INR);
    const taxINR = Math.round(d.usTaxUSD * USD_INR);
    const eff = d.grossUSD ? (d.usTaxUSD / d.grossUSD) * 100 : 0;
    dataRow(ws, row++, [d.security, d.ticker, d.date, quarterOf(d.date), d.grossUSD, d.usTaxUSD, grossINR, taxINR, grossINR - taxINR, `${eff.toFixed(0)}%`], { alt: i % 2 === 1, moneyCols: [6, 7, 8] });
  });
  totalRow(ws, row++, ["Total", "", "", "", "", "", t.divGrossINR, t.usTaxINR, t.divGrossINR - t.usTaxINR, ""], [6, 7, 8]);
  disclaimer(ws, row + 1, LAST);
}

function buildFSI(wb: Workbook, c: Client) {
  const ws = wb.addWorksheet("Schedule FSI");
  ws.columns = [{ width: 8 }, { width: 16 }, { width: 22 }, { width: 8 }, { width: 22 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 14 }];
  brandHeader(ws, 10, "Schedule FSI — Foreign Source Income", "Income from outside India & tax relief (resident Indians only)", c);
  const t = clientTotals(c);
  const cgTaxIndia = Math.round(t.stcgINR * 0.39 + t.ltcgINR * 0.125); // illustrative
  const divTaxIndia = Math.round(t.divGrossINR * 0.30);
  const reliefD = Math.min(t.usTaxINR, divTaxIndia);
  summaryBand(ws, 6, 10, [["Country", "USA – 002"], ["Capital gains", fmtINR(t.capGainsINR)], ["Dividends", fmtINR(t.divGrossINR)], ["Foreign tax paid", fmtINR(t.usTaxINR)], ["Relief claimable", fmtINR(reliefD)]]);
  tableHead(ws, 7, ["Sl.", "Country code", "TIN / Passport", "Sl", "Head of income (a)", "Income outside India ₹ (b)", "Tax paid outside India ₹ (c)", "Tax payable in India ₹ (d)", "Relief ₹ (e=lower of c,d)", "DTAA article"]);
  dataRow(ws, 8, ["1", "USA – 002", c.usId, "iii", "Capital Gains", t.capGainsINR, 0, cgTaxIndia, 0, "—"], { moneyCols: [5, 6, 7, 8] });
  dataRow(ws, 9, ["", "", "", "iv", "Other Sources (Dividend)", t.divGrossINR, t.usTaxINR, divTaxIndia, reliefD, "10, 25"], { alt: true, moneyCols: [5, 6, 7, 8] });
  totalRow(ws, 10, ["", "", "", "", "Total", t.capGainsINR + t.divGrossINR, t.usTaxINR, cgTaxIndia + divTaxIndia, reliefD, ""], [5, 6, 7, 8]);
  disclaimer(ws, 12, 10);
}

function buildForm67(wb: Workbook, c: Client) {
  const ws = wb.addWorksheet("Form 67");
  ws.columns = [{ width: 7 }, { width: 16 }, { width: 14 }, { width: 18 }, { width: 16 }, { width: 9 }, { width: 18 }, { width: 16 }, { width: 14 }];
  brandHeader(ws, 9, "Form 67 — Foreign Tax Credit Application", "File before your ITR to claim credit for US tax already paid", c);
  const t = clientTotals(c);
  const divTaxIndia = Math.round(t.divGrossINR * 0.30);
  const credit = Math.min(t.usTaxINR, divTaxIndia);
  summaryBand(ws, 6, 9, [["Source", "US Dividends"], ["Income", fmtINR(t.divGrossINR)], ["US tax paid", fmtINR(t.usTaxINR)], ["Credit claimed", fmtINR(credit)]]);
  tableHead(ws, 7, ["Sr", "Country", "Source", "Income outside India ₹", "Tax paid outside ₹", "Rate", "Tax payable in India ₹", "Credit claimed u/s 90 ₹", "DTAA rate"]);
  dataRow(ws, 8, ["1", "USA – 002", "Dividend", t.divGrossINR, t.usTaxINR, "25%", divTaxIndia, credit, "25%"], { moneyCols: [3, 4, 6, 7] });
  totalRow(ws, 9, ["", "", "Total", t.divGrossINR, t.usTaxINR, "", divTaxIndia, credit, ""], [3, 4, 6, 7]);
  disclaimer(ws, 11, 9);
}

function buildTR(wb: Workbook, c: Client) {
  const ws = wb.addWorksheet("Schedule TR");
  ws.columns = [{ width: 7 }, { width: 26 }, { width: 24 }, { width: 22 }, { width: 22 }, { width: 16 }];
  brandHeader(ws, 6, "Schedule TR — Summary of Tax Relief", "Total foreign tax paid & relief claimed (links to Schedule FSI)", c);
  const t = clientTotals(c);
  const divTaxIndia = Math.round(t.divGrossINR * 0.30);
  const relief = Math.min(t.usTaxINR, divTaxIndia);
  summaryBand(ws, 6, 6, [["Total foreign tax paid", fmtINR(t.usTaxINR)], ["Relief u/s 90", fmtINR(relief)]]);
  tableHead(ws, 7, ["Sr", "Country code", "TIN / Passport", "Total tax paid outside ₹", "Total relief available ₹", "Relief u/s"]);
  dataRow(ws, 8, ["1", "USA – 002", c.usId, t.usTaxINR, relief, "90"], { moneyCols: [3, 4] });
  totalRow(ws, 9, ["", "", "Total relief (section 90/90A)", t.usTaxINR, relief, ""], [3, 4]);
  disclaimer(ws, 11, 6);
}

const BUILDERS: Record<DocType, (wb: Workbook, c: Client) => void> = {
  holdings: buildHoldings, pnl: buildPnL, dividend: buildDividend,
  fsi: buildFSI, form67: buildForm67, tr: buildTR,
};

const FILENAMES: Record<DocType, string> = {
  holdings: "Holdings-Statement", pnl: "Tax-PnL", dividend: "Dividend-Report",
  fsi: "Schedule-FSI", form67: "Form-67", tr: "Schedule-TR",
};

export async function generateDoc(client: Client, type: DocType) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Voguestock × Valura";
  wb.created = new Date(FY_END);
  BUILDERS[type](wb, client);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Voguestock-Valura_${FILENAMES[type]}_${client.name.replace(/\s+/g, "-")}_FY25-26.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function generateAll(client: Client) {
  const types: DocType[] = ["holdings", "pnl", "dividend", "fsi", "tr", "form67"];
  for (const t of types) { await generateDoc(client, t); }
}

void FY_START;
