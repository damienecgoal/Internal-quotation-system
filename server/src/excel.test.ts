import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { CATEGORIES, ITEMS, SFK_SAMPLE } from "./catalog.ts";
import { priceQuotation } from "./calc.ts";
import { buildQuotationWorkbook } from "./excel.ts";

test("excel export fills the quotation template from the sample", async () => {
  const quantities = Object.fromEntries(ITEMS.map((item) => [item.id, item.sampleQuantity]));
  const priced = priceQuotation(CATEGORIES, ITEMS, quantities, SFK_SAMPLE.discount);
  const file = await buildQuotationWorkbook({
    quotationNo: "KR-30032026SFK-011",
    customerName: SFK_SAMPLE.customerName,
    attn: SFK_SAMPLE.attn,
    tel: SFK_SAMPLE.tel,
    email: SFK_SAMPLE.email,
    address: SFK_SAMPLE.address,
    subject: SFK_SAMPLE.subject,
    customerNo: SFK_SAMPLE.customerNo,
    yourRef: SFK_SAMPLE.yourRef,
    revision: SFK_SAMPLE.revision,
    quotationDate: SFK_SAMPLE.quotationDate,
    contractMonths: SFK_SAMPLE.contractMonths,
    discount: SFK_SAMPLE.discount,
    discountNote: SFK_SAMPLE.discountNote,
    lines: priced.lines,
    total: priced.total,
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ExcelJS.Buffer);
  assert.deepEqual(
    workbook.worksheets.map((sheet) => sheet.name),
    ["Quotation"],
  );
  const sheet = workbook.getWorksheet("Quotation");
  assert.ok(sheet);
  const writtenDate = sheet.getCell("K7").value;
  assert.ok(writtenDate instanceof Date);
  assert.equal(writtenDate.toISOString().slice(0, 10), "2026-03-30");
  assert.equal(sheet.getCell("K8").value, "KR-30032026SFK-011");
  assert.match(String(sheet.getCell("F62").value), /man-day/);
  assert.equal(sheet.getCell("C7").value, SFK_SAMPLE.customerName);
  assert.equal(sheet.getCell("D19").value, 51);
  assert.equal(sheet.getCell("F115").value, 180);
  assert.equal(sheet.getCell("I115").value, 1500);
  assert.equal(sheet.getCell("G52").value, "month");
  assert.equal(sheet.getCell("G45").value, "unit");
  assert.equal(sheet.getCell("K246").value, 180400);

  const setup = sheet.getCell("K45").value;
  assert.ok(setup && typeof setup === "object" && "formula" in setup);
  assert.equal(setup.formula, "F45*I45");
  assert.equal(setup.result, 50000);

  const maintenance = sheet.getCell("K55").value;
  assert.ok(maintenance && typeof maintenance === "object" && "formula" in maintenance);
  assert.equal(maintenance.formula, "F55*I55");
  assert.equal(maintenance.result, 51000);

  const total = sheet.getCell("K297").value;
  assert.ok(total && typeof total === "object" && "formula" in total);
  assert.equal(total.result, 2_040_700);

  const rateOnly = sheet.getCell("K62").value;
  const rateText = typeof rateOnly === "string" ? rateOnly : JSON.stringify(rateOnly);
  assert.match(rateText, /Rate only/);
});
