import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
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

export const templatePath = fileURLToPath(new URL("../templates/quotation.xlsx", import.meta.url));

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

export async function buildQuotationWorkbook(quote: WorkbookQuotation): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
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

  workbook.calcProperties.fullCalcOnLoad = true;
  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
