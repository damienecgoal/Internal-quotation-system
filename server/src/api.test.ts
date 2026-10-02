import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ExcelJS from "exceljs";
import { ITEMS, SFK_SAMPLE } from "./catalog.ts";

process.env.DATABASE_PATH = path.join(mkdtempSync(path.join(tmpdir(), "quote-api-")), "test.db");

function sampleBody() {
  return {
    ...SFK_SAMPLE,
    lines: ITEMS.map((item) => ({ priceItemId: item.id, quantity: item.sampleQuantity })),
  };
}

test("saving the SFK sample numbers quotations and returns the workbook total", async () => {
  const { app } = await import("./app.ts");
  const health = await app.request("/api/health");
  assert.equal(health.status, 200);

  const priceList = await app.request("/api/price-list");
  const catalog = (await priceList.json()) as { ok: boolean; categories: { id: string; items: unknown[] }[] };
  assert.equal(catalog.ok, true);
  assert.equal(catalog.categories.length, 12);

  const firstResponse = await app.request("/api/quotations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sampleBody()),
  });
  assert.equal(firstResponse.status, 201);
  const first = (await firstResponse.json()) as {
    ok: boolean;
    quotation: { id: string; quotationNo: string; total: number };
  };
  assert.equal(first.quotation.quotationNo, "KR-30032026SFK-011");
  assert.equal(first.quotation.total, 2_040_700);

  const secondResponse = await app.request("/api/quotations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sampleBody()),
  });
  const second = (await secondResponse.json()) as { quotation: { quotationNo: string } };
  assert.equal(second.quotation.quotationNo, "KR-30032026SFK-012");

  const invalid = await app.request("/api/quotations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(invalid.status, 400);

  const listed = (await (await app.request("/api/quotations")).json()) as { quotations: unknown[] };
  assert.equal(listed.quotations.length, 2);

  const excel = await app.request(`/api/quotations/${first.quotation.id}/excel`);
  assert.equal(excel.status, 200);
  assert.match(excel.headers.get("content-type") ?? "", /spreadsheetml/);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await excel.arrayBuffer()) as unknown as ExcelJS.Buffer);
  const total = workbook.getWorksheet("Quotation")?.getCell("K297").value;
  assert.ok(total && typeof total === "object" && "result" in total);
  assert.equal(total.result, 2_040_700);
});
