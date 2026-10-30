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
  assert.match(String(sheet.getCell("F53").value), /man-day/);
  assert.equal(sheet.getCell("C7").value, SFK_SAMPLE.customerName);
  assert.equal(sheet.getCell("D19").value, 39);
  assert.equal(sheet.getCell("F101").value, 1);
  assert.equal(sheet.getCell("I101").value, 1500);
  assert.equal(sheet.getCell("G51").value, "month(s)");
  assert.equal(sheet.getCell("G44").value, "unit");
  assert.equal(sheet.getCell("G49").value, "time");
  assert.equal(String(sheet.getCell("I51").value).trim(), "Included");

  const setup = sheet.getCell("K44").value;
  assert.ok(setup && typeof setup === "object" && "formula" in setup);
  assert.equal(setup.formula, "F44*I44");
  assert.equal(setup.result, 20000);

  const lock = sheet.getCell("K101").value;
  assert.ok(lock && typeof lock === "object" && "formula" in lock);
  assert.equal(lock.formula, "F101*I101");
  assert.equal(lock.result, 1500);

  const total = sheet.getCell("K256").value;
  assert.ok(total && typeof total === "object" && "formula" in total);
  assert.equal(total.result, 297_500);

  const rateOnly = sheet.getCell("K53").value;
  const rateText = typeof rateOnly === "string" ? rateOnly : JSON.stringify(rateOnly);
  assert.match(rateText, /Rate only/);
});

test("excel export hides a module when none of its items are included", async () => {
  const quantities = Object.fromEntries(ITEMS.map((item) => [item.id, item.sampleQuantity]));
  const included = Object.fromEntries(ITEMS.map((item) => [item.id, item.categoryId !== "B" && item.sampleQuantity > 0]));
  const priced = priceQuotation(CATEGORIES, ITEMS, quantities, SFK_SAMPLE.discount, included);
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
  const sheet = workbook.getWorksheet("Quotation");
  assert.ok(sheet);
  assert.equal(sheet.getRow(44).hidden, false);
  assert.equal(sheet.getRow(65).hidden, true);
  assert.equal(sheet.getRow(74).hidden, true);
  assert.equal(sheet.getRow(59).hidden, false);
  assert.equal(sheet.getCell("B24").value, "A");
  assert.equal(sheet.getRow(25).hidden, true);
  assert.equal(sheet.getCell("B26").value, "B");
  assert.equal(sheet.getCell("B75").value, "B");
  assert.equal(sheet.getCell("B27").value, "C");
  assert.equal(sheet.getCell("B94").value, "C");
  assert.equal(sheet.getCell("B80").value, "B1");
});

test("excel export skips a price item that has no template row", async () => {
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
    lines: [
      ...priced.lines,
      {
        priceItemId: "l2",
        categoryId: "L",
        quantity: 1,
        unitPrice: 1000,
        chargeBasis: "unit",
        pricingType: "calculated",
        amount: 1000,
        included: true,
      },
    ],
    total: priced.total + 1000,
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ExcelJS.Buffer);
  const total = workbook.getWorksheet("Quotation")?.getCell("K256").value;
  assert.ok(total && typeof total === "object" && "result" in total);
  assert.equal(total.result, priced.total);
});
