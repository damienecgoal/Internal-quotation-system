import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { getContext } from "./context.ts";
import {
  CATEGORIES,
  CONTRACT_MONTHS_CELL,
  ITEMS,
  TOTAL_CELL,
} from "./catalog.ts";
import type { PricedLine } from "./calc.ts";
import { excelSerial } from "./calc.ts";
import { NOTE_SLOTS } from "./note-slots.ts";

function templatePath(): string {
  return fileURLToPath(new URL("../templates/quotation.xlsx", import.meta.url));
}

const itemsById = new Map(ITEMS.map((item) => [item.id, item]));

export type WorkbookQuotation = {
  quotationNo: string;
  customerName: string;
  attn: string;
  tel: string;
  email: string;
  address: string;
  subject: string;
  customerNo: string;
  yourRef: string;
  revision: string;
  quotationDate: string;
  contractMonths: number;
  discount: number;
  discountNote: string;
  lines: PricedLine[];
  total: number;
};

const MODULE_ROWS: Record<string, Array<[number, number]>> = {
  A: [[37, 58]],
  B: [[60, 74]],
  C: [[75, 93]],
  D: [[94, 115]],
  E: [[116, 130]],
  F: [[131, 155]],
  G: [[156, 175]],
  H: [[176, 191]],
  I: [[192, 207]],
  J: [[208, 222]],
  K: [[223, 237]],
  L: [[238, 255]],
};

function basisLabel(basis: PricedLine["chargeBasis"]): string {
  if (basis === "one_off") return "one off";
  return basis;
}

const SUMMARY_LETTER_ROW: Record<string, number> = {
  A: 24,
  B: 25,
  C: 26,
  D: 27,
  E: 28,
  F: 29,
  G: 30,
  H: 31,
  I: 32,
  J: 33,
  K: 34,
  L: 35,
};

const SECTION_LETTER_ROW: Record<string, number> = {
  A: 38,
  B: 60,
  C: 75,
  D: 94,
  E: 116,
  F: 131,
  G: 156,
  H: 176,
  I: 192,
  J: 208,
  K: 223,
  L: 238,
};

function renumberIncludedCategories(sheet: ExcelJS.Worksheet, lines: PricedLine[]) {
  const included = new Set(lines.filter((line) => line.included).map((line) => line.categoryId));
  let next = 0;
  for (const category of CATEGORIES) {
    const summaryRow = SUMMARY_LETTER_ROW[category.id];
    if (!included.has(category.id)) {
      if (summaryRow) sheet.getRow(summaryRow).hidden = true;
      continue;
    }
    const letter = String.fromCharCode(65 + next);
    next += 1;
    if (summaryRow) sheet.getCell(`B${summaryRow}`).value = letter;
    const sectionRow = SECTION_LETTER_ROW[category.id];
    if (sectionRow) sheet.getCell(`B${sectionRow}`).value = letter;
    if (letter === category.code) continue;
    const prefix = new RegExp(`^${category.code}(?=\\d|$)`);
    for (const spec of ITEMS.filter((item) => item.categoryId === category.id && item.writesCode)) {
      const cell = sheet.getCell(spec.cells.code);
      const current = plainCell(cell.value);
      if (current === "" || !prefix.test(current)) continue;
      cell.value = current.replace(prefix, letter);
    }
  }
}

function hideExcludedModules(sheet: ExcelJS.Worksheet, lines: PricedLine[]) {
  const included = new Set(lines.filter((line) => line.included).map((line) => line.categoryId));
  for (const [categoryId, ranges] of Object.entries(MODULE_ROWS)) {
    if (included.has(categoryId)) continue;
    for (const [start, end] of ranges) {
      for (let row = start; row <= end; row += 1) sheet.getRow(row).hidden = true;
    }
  }
  const integrated = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  if (integrated.every((categoryId) => !included.has(categoryId))) sheet.getRow(59).hidden = true;
}

function writeFormulaResult(
  cell: ExcelJS.Cell,
  result: number,
  rewrite?: { quantity?: string; price?: string },
) {
  const current = cell.value;
  if (current && typeof current === "object" && "formula" in current && typeof current.formula === "string") {
    let formula = current.formula;
    if (formula.includes("D19") && rewrite?.quantity && rewrite.price) {
      formula = `${rewrite.quantity}*${rewrite.price}`;
    }
    cell.value = { formula, result };
    return;
  }
  cell.value = result;
}

export type CatalogText = {
  id: string;
  displayCode: string;
  name: string;
  notes: string[];
};

function plainCell(value: ExcelJS.CellValue): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "result" in value && typeof value.result === "string") return value.result.trim();
  return "";
}

function writeSharedText(sheet: ExcelJS.Worksheet, texts: CatalogText[]) {
  const byId = new Map(texts.map((text) => [text.id, text]));
  for (const spec of ITEMS) {
    const text = byId.get(spec.id);
    if (!text) continue;
    const row = Number(spec.cells.amount.replace(/\D/g, ""));
    if (spec.writesCode) {
      const codeCell = sheet.getCell(spec.cells.code);
      const currentCode = plainCell(codeCell.value);
      if (currentCode === "" || currentCode === spec.displayCode) codeCell.value = text.displayCode;
    }
    const nameColumns = ["C", "D", "E"] as const;
    const currentNames = nameColumns.map((column) => plainCell(sheet.getCell(`${column}${row}`).value));
    nameColumns.forEach((column, index) => {
      if (index === 0 || currentNames[index] === spec.name) sheet.getCell(`${column}${row}`).value = text.name;
    });
    for (const [index, noteRow] of (NOTE_SLOTS[spec.id] ?? []).entries()) {
      const note = text.notes[index] ?? "";
      const code = plainCell(sheet.getCell(`B${noteRow}`).value);
      sheet.getCell(`C${noteRow}`).value = code !== "" && note.startsWith(`${code} `) ? note.slice(code.length + 1) : note;
    }
  }
}

export async function buildQuotationWorkbook(quote: WorkbookQuotation, texts: CatalogText[] = []): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const template = getContext()?.template;
  if (template) {
    await workbook.xlsx.load(template as unknown as ExcelJS.Buffer);
  } else {
    await workbook.xlsx.readFile(templatePath());
  }
  for (const sheet of [...workbook.worksheets]) {
    if (sheet.name !== "Quotation") workbook.removeWorksheet(sheet.id);
  }
  const sheet = workbook.getWorksheet("Quotation");
  if (!sheet) throw new Error("Quotation sheet is missing from the template.");
  if (texts.length > 0) writeSharedText(sheet, texts);

  sheet.getCell("C7").value = quote.customerName;
  sheet.getCell("C8").value = quote.attn;
  sheet.getCell("C9").value = quote.tel;
  sheet.getCell("C10").value = quote.email;
  sheet.getCell("C11").value = quote.address;
  sheet.getCell("C12").value = quote.subject;
  sheet.getCell("K7").value = excelSerial(quote.quotationDate);
  sheet.getCell("K8").value = quote.quotationNo;
  sheet.getCell("K9").value = quote.customerNo;
  sheet.getCell("K10").value = quote.yourRef;
  sheet.getCell("K11").value = quote.revision;
  sheet.getCell(CONTRACT_MONTHS_CELL).value = quote.contractMonths;

  const mappedLines = quote.lines.filter((line) => itemsById.has(line.priceItemId));
  for (const line of mappedLines) {
    const spec = itemsById.get(line.priceItemId);
    if (!spec) continue;
    const exportQuantity = line.included ? line.quantity : 0;
    const exportAmount = line.included ? line.amount : 0;
    if (!spec.cells.quantityIsLabel && spec.cells.quantity) {
      sheet.getCell(spec.cells.quantity).value = exportQuantity;
    }
    if (spec.cells.unit) {
      const label = line.chargeBasis === spec.chargeBasis && spec.unitLabel ? spec.unitLabel : basisLabel(line.chargeBasis);
      sheet.getCell(spec.cells.unit).value = label;
    }
    if (spec.cells.price) sheet.getCell(spec.cells.price).value = line.unitPrice;
    if (line.pricingType === "calculated") {
      writeFormulaResult(sheet.getCell(spec.cells.amount), exportAmount, {
        quantity: spec.cells.quantity,
        price: spec.cells.price,
      });
    }
  }

  const writtenTotal = mappedLines.reduce((sum, line) => sum + line.amount, 0) - quote.discount;
  for (const category of CATEGORIES) {
    const subtotal = mappedLines
      .filter((line) => line.categoryId === category.id)
      .reduce((sum, line) => sum + line.amount, 0);
    writeFormulaResult(sheet.getCell(category.subtotalCell), subtotal);
  }
  const totalCell = sheet.getCell(TOTAL_CELL);
  const currentTotal = totalCell.value;
  if (currentTotal && typeof currentTotal === "object" && "formula" in currentTotal && typeof currentTotal.formula === "string") {
    const base = currentTotal.formula.replace(/^\(|\)$/g, "").replace(/-\d+$/, "");
    const formula = quote.discount > 0 ? `(${base})-${quote.discount}` : base;
    totalCell.value = { formula, result: writtenTotal };
  } else {
    totalCell.value = writtenTotal;
  }
  hideExcludedModules(sheet, mappedLines);
  renumberIncludedCategories(sheet, mappedLines);

  workbook.calcProperties.fullCalcOnLoad = true;
  const output = await workbook.xlsx.writeBuffer();
  return new Uint8Array(output);
}
