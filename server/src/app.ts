import { Hono } from "hono";
import { cors } from "hono/cors";
import { SFK_SAMPLE } from "./catalog.ts";
import { buildQuotationWorkbook } from "./excel.ts";
import { getDb } from "./db.ts";
import { createQuotation, getPriceList, getQuotation, listQuotations } from "./quotations.ts";
import { listItems } from "./db.ts";
import { validateCreate } from "./validate.ts";

export const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);

app.onError((error, c) => {
  console.error(error);
  return c.json({ ok: false, error: "server_error", message: "Something went wrong." }, 500);
});

app.get("/api/health", (c) => {
  getDb();
  return c.json({ ok: true });
});

app.get("/api/price-list", (c) => {
  const { categories } = getPriceList();
  return c.json({ ok: true, categories, sample: SFK_SAMPLE });
});

app.get("/api/quotations", (c) => {
  return c.json({ ok: true, quotations: listQuotations() });
});

app.get("/api/quotations/:id", (c) => {
  const quotation = getQuotation(c.req.param("id"));
  if (!quotation) return c.json({ ok: false, error: "not_found", message: "Quotation not found." }, 404);
  return c.json({ ok: true, quotation });
});

app.get("/api/quotations/:id/excel", async (c) => {
  const quotation = getQuotation(c.req.param("id"));
  if (!quotation) return c.json({ ok: false, error: "not_found", message: "Quotation not found." }, 404);
  const file = await buildQuotationWorkbook(quotation);
  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  c.header("Content-Disposition", `attachment; filename="${quotation.quotationNo}.xlsx"`);
  return c.body(new Uint8Array(file));
});

app.post("/api/quotations", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json", message: "Request body must be JSON." }, 400);
  }
  const items = listItems().map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    unitPrice: item.unitPrice,
    pricingType: item.pricingType,
    chargeBasis: item.chargeBasis,
    quantityLocked: item.quantityLocked,
  }));
  const parsed = validateCreate(body, items);
  if (!parsed.ok) return c.json({ ok: false, error: "validation", message: parsed.message }, 400);
  const quotation = createQuotation(parsed.value);
  return c.json({ ok: true, quotation }, 201);
});
