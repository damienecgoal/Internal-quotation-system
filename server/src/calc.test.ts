import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES, ITEMS, SFK_SAMPLE } from "./catalog.ts";
import { excelSerial, formatQuotationNo, lineAmount, normalizeShortCode, priceQuotation } from "./calc.ts";

const EXPECTED_SUBTOTALS: Record<string, number> = {
  A: 40000,
  B: 10000,
  C: 12000,
  D: 1500,
  E: 24000,
  F: 72800,
  G: 11200,
  H: 22000,
  I: 50000,
  J: 21000,
  K: 21000,
  L: 12000,
};

test("catalog has one fixed-price list under categories A to L", () => {
  assert.equal(CATEGORIES.length, 12);
  assert.equal(ITEMS.length, 37);
  const ids = new Set(ITEMS.map((item) => item.id));
  assert.equal(ids.size, ITEMS.length);
  for (const item of ITEMS) {
    assert.ok(CATEGORIES.some((category) => category.id === item.categoryId));
    assert.ok(item.cells.amount);
    if (item.pricingType === "calculated") {
      assert.ok(item.cells.quantity);
      assert.ok(item.cells.price);
      assert.ok(item.cells.unit);
    }
  }
});

test("sample quantities reproduce the reference total of 297500", () => {
  const quantities = Object.fromEntries(ITEMS.map((item) => [item.id, item.sampleQuantity]));
  const priced = priceQuotation(CATEGORIES, ITEMS, quantities, SFK_SAMPLE.discount);
  for (const category of priced.categorySubtotals) {
    assert.equal(category.subtotal, EXPECTED_SUBTOTALS[category.categoryId], category.categoryId);
  }
  assert.equal(priced.beforeDiscount, 297_500);
  assert.equal(priced.total, 297_500);
});

test("one-off lines use the corrected fee times the count", () => {
  const priced = priceQuotation(
    [{ id: "W" }],
    [
      {
        id: "once",
        categoryId: "W",
        unitPrice: 100,
        pricingType: "calculated",
        chargeBasis: "one_off",
        quantityLocked: false,
      },
    ],
    { once: 1 },
    0,
    { once: true },
    { once: 2500 },
  );
  assert.equal(priced.lines[0]?.chargeBasis, "one_off");
  assert.equal(priced.lines[0]?.unitPrice, 2500);
  assert.equal(priced.total, 2500);
});

test("weekly and rate-only items follow count times fixed price", () => {
  assert.equal(lineAmount({ pricingType: "calculated", unitPrice: 800 }, 4), 3200);
  assert.equal(lineAmount({ pricingType: "rate_only", unitPrice: 800 }, 4), 0);
  const priced = priceQuotation(
    [{ id: "W" }],
    [
      {
        id: "week-1",
        categoryId: "W",
        unitPrice: 100,
        pricingType: "calculated",
        chargeBasis: "week",
        quantityLocked: false,
      },
    ],
    { "week-1": 6 },
    50,
  );
  assert.equal(priced.total, 550);
});

test("unchecked items stay out of the total", () => {
  const quantities = Object.fromEntries(ITEMS.map((item) => [item.id, item.sampleQuantity]));
  const included = Object.fromEntries(ITEMS.map((item) => [item.id, item.id === "a1"]));
  const priced = priceQuotation(CATEGORIES, ITEMS, quantities, 0, included);
  assert.equal(priced.total, 20000);
  assert.equal(priced.lines.find((line) => line.priceItemId === "a2")?.included, false);
  assert.equal(priced.lines.find((line) => line.priceItemId === "a2")?.amount, 0);
});

test("quotation numbers use the date, short code, and sequence", () => {
  assert.equal(normalizeShortCode(" sf-k "), "SFK");
  assert.equal(formatQuotationNo("2026-03-30", "SFK", 11), "KR-30032026SFK-011");
  assert.equal(formatQuotationNo("2026-03-30", "SFK", 12), "KR-30032026SFK-012");
  assert.equal(excelSerial("2026-04-14"), 46126);
});
