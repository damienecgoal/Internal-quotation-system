import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { getContext } from "./context.ts";
import {
  CATEGORIES,
  CONTRACT_MONTHS_CELL,
  DISCOUNT_CELL,
  DISCOUNT_NOTE_CELL,
  ITEMS,
  TOTAL_CELL,
} from "./catalog.ts";
import type { PricedLine } from "./calc.ts";
import { excelSerial } from "./calc.ts";

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
  A: [[38, 67]],
  B: [[69, 85]],
  C: [[86, 107]],
  D: [[108, 131]],
  E: [[132, 152]],
  F: [[153, 180]],
  G: [[181, 200]],
  H: [[201, 228]],
  I: [[229, 245], [247, 250]],
  J: [[251, 268]],
  K: [[269, 283]],
  L: [[284, 295]],
};

function hideExcludedModules(sheet: ExcelJS.Worksheet, lines: PricedLine[]) {
  const included = new Set(lines.filter((line) => line.included).map((line) => line.categoryId));
  for (const [categoryId, ranges] of Object.entries(MODULE_ROWS)) {
    if (included.has(categoryId)) continue;
    for (const [start, end] of ranges) {
      for (let row = start; row <= end; row += 1) sheet.getRow(row).hidden = true;
    }
  }
  const integrated = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  if (integrated.every((categoryId) => !included.has(categoryId))) sheet.getRow(68).hidden = true;
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

export async function buildQuotationWorkbook(quote: WorkbookQuotation): Promise<Uint8Array> {
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
  sheet.getCell(DISCOUNT_NOTE_CELL).value = quote.discountNote;
  sheet.getCell(DISCOUNT_CELL).value = quote.discount;

  for (const line of quote.lines) {
    const spec = itemsById.get(line.priceItemId);
    if (!spec) throw new Error(`No Excel cell map for ${line.priceItemId}.`);
    const exportQuantity = line.included ? line.quantity : 0;
    const exportAmount = line.included ? line.amount : 0;
    if (!spec.cells.quantityIsLabel && spec.cells.quantity) {
      sheet.getCell(spec.cells.quantity).value = exportQuantity;
    }
    if (spec.cells.unit) sheet.getCell(spec.cells.unit).value = line.chargeBasis;
    if (spec.cells.price) sheet.getCell(spec.cells.price).value = line.unitPrice;
    if (line.pricingType === "calculated") {
      writeFormulaResult(sheet.getCell(spec.cells.amount), exportAmount, {
        quantity: spec.cells.quantity,
        price: spec.cells.price,
      });
    }
  }

  for (const category of CATEGORIES) {
    const subtotal = quote.lines
      .filter((line) => line.categoryId === category.id)
      .reduce((sum, line) => sum + line.amount, 0);
    writeFormulaResult(sheet.getCell(category.subtotalCell), subtotal);
  }
  writeFormulaResult(sheet.getCell("K296"), quote.discount);
  writeFormulaResult(sheet.getCell(TOTAL_CELL), quote.total);
  hideExcludedModules(sheet, quote.lines);

  workbook.calcProperties.fullCalcOnLoad = true;
  const output = await workbook.xlsx.writeBuffer();
  return new Uint8Array(output);
}
