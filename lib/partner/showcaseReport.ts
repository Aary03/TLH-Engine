/**
 * Voguestock × Valura — comprehensive co-branded "Foreign Income & Tax Report".
 * One workbook, many tabs: Summary, Capital Gains, Schedule FA, Schedule FSI,
 * and a Filing Checklist. Generated client-side via exceljs.
 */
import type { Workbook, Worksheet } from "exceljs";
import {
  SHOW, SHOW_CLIENT, SHOW_FUND, computeShow, inrShort, FILING_CHECKLIST, USD_INR,
} from "@/lib/showcase-data";

const RED = "FFE0822E";       // Voguestock (orange)
const GREEN = "FF05A049";     // Valura
const NAVY = "FF00111B";
const GREEN_SOFT = "FFEDFAF3";
const RED_SOFT = "FFFCEFE0";
const GREY = "FF6B7280";
const BORDER = "FFE5E7EB";
const WHITE = "FFFFFFFF";
const ALT = "FFF7FAF8";
const money = "#,##0;[Red]-#,##0";

function thin() {
  const c = { style: "thin" as const, color: { argb: BORDER } };
  return { top: c, left: c, bottom: c, right: c };
}

function banner(ws: Worksheet, last: number, title: string, sub: string) {
  const L = ws.getColumn(last).letter;
  ws.mergeCells(`A1:${L}1`);
  const b = ws.getCell("A1");
  b.value = {
    richText: [
      { text: "Voguestock", font: { bold: true, size: 18, color: { argb: RED } } },
      { text: "  ×  ", font: { bold: true, size: 16, color: { argb: WHITE } } },
      { text: "Valura", font: { bold: true, size: 18, color: { argb: GREEN } } },
    ],
  };
  b.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  b.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 34;

  ws.mergeCells(`A2:${L}2`);
  const t = ws.getCell("A2"); t.value = title;
  t.font = { bold: true, size: 14, color: { argb: NAVY } };
  t.alignment = { vertical: "middle", indent: 1 }; ws.getRow(2).height = 22;

  ws.mergeCells(`A3:${L}3`);
  const s = ws.getCell("A3"); s.value = sub;
  s.font = { italic: true, size: 10, color: { argb: GREY } }; s.alignment = { indent: 1 };

  ws.mergeCells(`A4:${L}4`);
  const c = ws.getCell("A4");
  c.value = {
    richText: [
      { text: "Client: ", font: { color: { argb: GREY }, size: 10 } },
      { text: SHOW_CLIENT.name, font: { bold: true, color: { argb: NAVY }, size: 10 } },
      { text: "   PAN: ", font: { color: { argb: GREY }, size: 10 } },
      { text: SHOW_CLIENT.pan, font: { bold: true, color: { argb: NAVY }, size: 10 } },
      { text: "   Status: ", font: { color: { argb: GREY }, size: 10 } },
      { text: SHOW_CLIENT.residency, font: { bold: true, color: { argb: NAVY }, size: 10 } },
      { text: "   FY: 2025-26", font: { bold: true, color: { argb: NAVY }, size: 10 } },
    ],
  };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_SOFT } };
  c.alignment = { vertical: "middle", indent: 1 }; ws.getRow(4).height = 20;
  ws.getRow(5).height = 6;
}

function section(ws: Worksheet, row: number, last: number, text: string) {
  const L = ws.getColumn(last).letter;
  ws.mergeCells(`A${row}:${L}${row}`);
  const c = ws.getCell(`A${row}`); c.value = text;
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  c.font = { bold: true, size: 10, color: { argb: WHITE } };
  c.alignment = { vertical: "middle", indent: 1 }; ws.getRow(row).height = 20;
}

function kv(ws: Worksheet, row: number, label: string, value: string | number, opts?: { money?: boolean; big?: boolean; accent?: string }) {
  const a = ws.getCell(`A${row}`); a.value = label;
  a.font = { size: 10, color: { argb: GREY } }; a.alignment = { indent: 1 };
  const b = ws.getCell(`B${row}`); b.value = value;
  b.font = { bold: true, size: opts?.big ? 13 : 10, color: { argb: opts?.accent || NAVY } };
  if (opts?.money) b.numFmt = money;
}

function head(ws: Worksheet, row: number, headers: string[]) {
  const r = ws.getRow(row);
  headers.forEach((h, i) => {
    const c = r.getCell(i + 1); c.value = h;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    c.font = { bold: true, color: { argb: WHITE }, size: 10 };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", wrapText: true, indent: i === 0 ? 1 : 0 };
    c.border = thin();
  });
  r.height = 30;
}

function row(ws: Worksheet, r: number, vals: (string | number)[], opts?: { alt?: boolean; money?: number[] }) {
  const rr = ws.getRow(r);
  vals.forEach((v, i) => {
    const c = rr.getCell(i + 1); c.value = v; c.border = thin();
    c.font = { size: 10, color: { argb: NAVY } };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
    if (opts?.money?.includes(i)) c.numFmt = money;
    if (opts?.alt) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT } };
  });
}

function disclaimer(ws: Worksheet, start: number, last: number) {
  const L = ws.getColumn(last).letter;
  const lines = [
    "Illustrative co-branded report — Voguestock × Valura.",
    "USD→INR at the SBI TT buying rate. Tax rules per Finance Act 2025 (FY 2025-26). Confirm with your CA before filing.",
  ];
  lines.forEach((l, i) => {
    const r = start + i; ws.mergeCells(`A${r}:${L}${r}`);
    const c = ws.getCell(`A${r}`); c.value = (i ? "• " : "") + l;
    c.font = { italic: true, size: 8.5, color: { argb: GREY }, bold: i === 0 }; c.alignment = { indent: 1 };
  });
}

/* ── tabs ── */
function tabSummary(wb: Workbook) {
  const m = computeShow();
  const ws = wb.addWorksheet("Summary");
  ws.columns = [{ width: 40 }, { width: 32 }];
  banner(ws, 2, "Foreign Income & Tax Report", "From purchase to filed return — your global investment, tax-solved.");

  section(ws, 6, 2, "The investment");
  kv(ws, 7, "Fund", SHOW_FUND.name);
  kv(ws, 8, "ISIN / domicile", `${SHOW_FUND.isin} · ${SHOW_FUND.domicile}`);
  kv(ws, 9, "Structure", `${SHOW_FUND.structure} · TER ${SHOW_FUND.ter}%`);
  kv(ws, 10, "Invested", SHOW.investINR, { money: true });
  kv(ws, 11, "Units allotted", m.units);
  kv(ws, 12, "Holding period", `${m.holdMonths} months (${m.isLong ? "Long-term" : "Short-term"})`);
  kv(ws, 13, "Redemption value", m.proceedsINR, { money: true, accent: GREEN });

  section(ws, 15, 2, "The tax — solved");
  kv(ws, 16, "Capital gain", m.gainINR, { money: true, accent: GREEN });
  kv(ws, 17, "Gain %", `+${m.gainPct.toFixed(1)}%`, { accent: GREEN });
  kv(ws, 18, "Tax type", "LTCG (held > 24 months)");
  kv(ws, 19, "Effective rate", `${m.effRatePct.toFixed(2)}%`);
  kv(ws, 20, "Capital gains tax payable", m.taxINR, { money: true, accent: RED });
  kv(ws, 21, "Net in hand", m.netINR, { money: true, accent: GREEN, big: true });
  kv(ws, 22, "US estate tax", "₹0  (Ireland-domiciled)", { accent: GREEN });
  kv(ws, 23, "Indian dividend tax", "₹0  (accumulating fund)", { accent: GREEN });

  section(ws, 25, 2, "Why it's beautiful");
  const points = [
    `Dividends accumulate inside the fund — ${inrShort(m.divReinvestedINR)} reinvested, taxed at 0% in India.`,
    `Dividend withholding is 15% inside the fund (US-Ireland treaty), not the 25% a direct US holding suffers.`,
    `No US estate tax: the unit is an Irish security, outside the US $60k / 40% net.`,
    `Only ONE thing to file: the capital gain (Schedule FSI) and the holding (Schedule FA). That's it.`,
  ];
  points.forEach((p, i) => {
    const r = 26 + i; ws.mergeCells(`A${r}:B${r}`);
    const c = ws.getCell(`A${r}`); c.value = "✓  " + p;
    c.font = { size: 10, color: { argb: NAVY } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 ? GREEN_SOFT : RED_SOFT } };
    c.alignment = { indent: 1, vertical: "middle", wrapText: true }; ws.getRow(r).height = 28;
  });
  disclaimer(ws, 31, 2);
}

function tabCapitalGains(wb: Workbook) {
  const m = computeShow();
  const ws = wb.addWorksheet("Capital Gains");
  ws.columns = [{ width: 30 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 16 }];
  banner(ws, 8, "Capital Gains — Tax P&L", "Realised gain on the Voguestock UCITS redemption · LTCG > 24 months at 12.5%");
  head(ws, 6, ["Security", "Buy date", "Sell date", "Units", "Cost ₹", "Proceeds ₹", "Gain ₹", "Type"]);
  row(ws, 7, [SHOW_FUND.short, SHOW.buyDate, SHOW.sellDate, m.units, SHOW.investINR, m.proceedsINR, m.gainINR, "LTCG"], { money: [4, 5, 6] });
  section(ws, 9, 8, "Tax computation");
  kv(ws, 10, "Long-term capital gain", m.gainINR, { money: true });
  kv(ws, 11, "LTCG base rate", "12.5%");
  kv(ws, 12, "+ surcharge (capped 15%) + 4% cess", `effective ${m.effRatePct.toFixed(2)}%`);
  kv(ws, 13, "Capital gains tax payable", m.taxINR, { money: true, accent: RED, big: true });
  kv(ws, 14, "Net proceeds after tax", m.netINR, { money: true, accent: GREEN, big: true });
  disclaimer(ws, 16, 8);
}

function tabScheduleFA(wb: Workbook) {
  const m = computeShow();
  const ws = wb.addWorksheet("Schedule FA");
  ws.columns = [{ width: 8 }, { width: 16 }, { width: 30 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }];
  banner(ws, 8, "Schedule FA — Foreign Assets", "Mandatory disclosure of the foreign holding · no minimum threshold");
  head(ws, 6, ["Sl.", "Country", "Entity & ISIN", "Acquired on", "Initial cost ₹", "Peak value ₹", "Closing value ₹", "Proceeds on sale ₹"]);
  const peak = Math.round(m.proceedsINR * 1.05);
  row(ws, 7, ["1", "Ireland – 105", `${SHOW_FUND.name} (${SHOW_FUND.isin})`, SHOW.buyDate, SHOW.investINR, peak, 0, m.proceedsINR], { money: [4, 5, 6, 7] });
  ws.getRow(9).height = 4;
  ws.mergeCells("A10:H10");
  const note = ws.getCell("A10");
  note.value = "Closing value is ₹0 because the holding was redeemed during the year. Report under Schedule FA, Table A3 (foreign equity/units).";
  note.font = { italic: true, size: 9, color: { argb: GREY } }; note.alignment = { indent: 1 };
  disclaimer(ws, 12, 8);
}

function tabScheduleFSI(wb: Workbook) {
  const m = computeShow();
  const ws = wb.addWorksheet("Schedule FSI");
  ws.columns = [{ width: 8 }, { width: 16 }, { width: 20 }, { width: 8 }, { width: 20 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 14 }];
  banner(ws, 9, "Schedule FSI — Foreign Source Income", "The foreign capital gain reported in your ITR");
  head(ws, 6, ["Sl.", "Country code", "TIN / Passport", "Sl", "Head of income", "Income outside India ₹", "Tax paid outside ₹", "Tax payable in India ₹", "Relief ₹"]);
  row(ws, 7, ["1", "Ireland – 105", SHOW_CLIENT.usId, "iii", "Capital Gains (LTCG)", m.gainINR, 0, m.taxINR, 0], { money: [5, 6, 7, 8] });
  ws.getRow(9).height = 4;
  ws.mergeCells("A10:I10");
  const note = ws.getCell("A10");
  note.value = "Tax paid outside India is ₹0 — an accumulating fund withholds no tax in your hands, so there is no Foreign Tax Credit to claim.";
  note.font = { italic: true, size: 9, color: { argb: GREY } }; note.alignment = { indent: 1 };
  disclaimer(ws, 12, 9);
}

function tabChecklist(wb: Workbook) {
  const ws = wb.addWorksheet("Filing Checklist");
  ws.columns = [{ width: 36 }, { width: 16 }, { width: 60 }];
  banner(ws, 3, "Filing Checklist", "Every report a resident Indian touches for this holding — and what's actually needed");
  head(ws, 6, ["Document", "Status", "Why"]);
  let r = 7;
  FILING_CHECKLIST.forEach((f, i) => {
    const rr = ws.getRow(r);
    const a = rr.getCell(1); a.value = f.doc; a.font = { bold: true, size: 10, color: { argb: NAVY } }; a.border = thin(); a.alignment = { indent: 1, vertical: "middle" };
    const b = rr.getCell(2); b.value = f.status === "required" ? "✓ Required" : "— Not needed";
    b.font = { bold: true, size: 10, color: { argb: f.status === "required" ? GREEN : GREY } }; b.border = thin(); b.alignment = { horizontal: "center", vertical: "middle" };
    b.fill = { type: "pattern", pattern: "solid", fgColor: { argb: f.status === "required" ? GREEN_SOFT : ALT } };
    const c = rr.getCell(3); c.value = f.note; c.font = { size: 9.5, color: { argb: GREY } }; c.border = thin(); c.alignment = { indent: 1, vertical: "middle", wrapText: true };
    rr.height = 26; r++;
    void i;
  });
  disclaimer(ws, r + 1, 3);
}

export async function generateShowcaseReport() {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Voguestock × Valura";
  tabSummary(wb);
  tabCapitalGains(wb);
  tabScheduleFA(wb);
  tabScheduleFSI(wb);
  tabChecklist(wb);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Voguestock-Valura_Foreign-Income-Tax-Report_${SHOW_CLIENT.name.replace(/\s+/g, "-")}_FY25-26.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

void USD_INR;
