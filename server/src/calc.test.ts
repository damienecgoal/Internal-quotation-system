import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES, ITEMS, SFK_SAMPLE } from "./catalog.ts";
import { excelSerial, formatQuotationNo, lineAmount, normalizeShortCode, priceQuotation } from "./calc.ts";

const EXPECTED_SUBTOTALS: Record<string, number> = {
  A: 172000,
  B: 35500,
  C: 101000,
  D: 331000,
  E: 444000,
  F: 470400,
  G: 59500,
  H: 151200,
  I: 225500,
  J: 10000,
  K: 85500,
  L: 135500,
};

test("catalog has one fixed-price list under categories A to L", () => {
  assert.equal(CATEGORIES.length, 12);
  assert.equal(ITEMS.length, 59);
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

test("sample quantities reproduce the reference total of 2040700", () => {
  const quantities = Object.fromEntries(ITEMS.map((item) => [item.id, item.sampleQuantity]));
  const priced = priceQuotation(CATEGORIES, ITEMS, quantities, SFK_SAMPLE.discount);
  for (const category of priced.categorySubtotals) {
    assert.equal(category.subtotal, EXPECTED_SUBTOTALS[category.categoryId], category.categoryId);
  }
  assert.equal(priced.beforeDiscount, 2_221_100);
  assert.equal(priced.total, 2_040_700);
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
  assert.equal(priced.total, 50000);
  assert.equal(priced.lines.find((line) => line.priceItemId === "a2")?.included, false);
  assert.equal(priced.lines.find((line) => line.priceItemId === "a2")?.amount, 0);
});

test("quotation numbers use the date, short code, and sequence", () => {
  assert.equal(normalizeShortCode(" sf-k "), "SFK");
  assert.equal(formatQuotationNo("2026-03-30", "SFK", 11), "KR-30032026SFK-011");
  assert.equal(formatQuotationNo("2026-03-30", "SFK", 12), "KR-30032026SFK-012");
  assert.equal(excelSerial("2026-04-14"), 46126);
});
