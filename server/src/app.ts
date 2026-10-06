import { Hono } from "hono";
import { cors } from "hono/cors";
import { SFK_SAMPLE } from "./catalog.ts";
import { ensureReady, listItems } from "./db.ts";
import { buildQuotationWorkbook } from "./excel.ts";
import { createQuotation, deleteQuotation, getPriceList, getQuotation, listQuotations, priceDraft, saveSharedItems, sharedCatalogText } from "./quotations.ts";
import { validateCreate, validateSharedItems } from "./validate.ts";
import { NOTE_SLOTS } from "./note-slots.ts";

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://internal-quotation-system.vercel.app",
];

export const app = new Hono();

app.use("*", async (_c, next) => {
  await ensureReady();
  await next();
});

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      const allowed = [
        ...defaultOrigins,
        ...(process.env.CORS_ORIGINS ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ];
      if (!origin || allowed.includes(origin)) return origin ?? allowed[0];
      return null;
    },
  }),
);

app.onError((error, c) => {
  console.error(error);
  return c.json({ ok: false, error: "server_error", message: "Something went wrong." }, 500);
});

app.get("/api/health", (c) => {
  return c.json({ ok: true });
});

app.get("/api/price-list", async (c) => {
  const { categories } = await getPriceList();
  return c.json({ ok: true, categories, sample: SFK_SAMPLE });
});

app.put("/api/price-items", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json", message: "Request body must be JSON." }, 400);
  }
  const existing = await listItems();
  const parsed = validateSharedItems(
    body,
    existing.map((item) => item.id),
    Object.fromEntries(existing.map((item) => [item.id, NOTE_SLOTS[item.id]?.length ?? 0])),
  );
  if (!parsed.ok) return c.json({ ok: false, error: "validation", message: parsed.message }, 400);
  const { categories } = await saveSharedItems(parsed.value);
  return c.json({ ok: true, categories, sample: SFK_SAMPLE });
});

app.get("/api/quotations", async (c) => {
  return c.json({ ok: true, quotations: await listQuotations() });
});

app.get("/api/quotations/:id", async (c) => {
  const quotation = await getQuotation(c.req.param("id"));
  if (!quotation) return c.json({ ok: false, error: "not_found", message: "Quotation not found." }, 404);
  return c.json({ ok: true, quotation });
});

app.delete("/api/quotations/:id", async (c) => {
  const removed = await deleteQuotation(c.req.param("id"));
  if (!removed) return c.json({ ok: false, error: "not_found", message: "Quotation not found." }, 404);
  return c.json({ ok: true });
});

app.post("/api/quotations/excel", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json", message: "Request body must be JSON." }, 400);
  }
  const stored = (await listItems()).map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    unitPrice: item.unitPrice,
    pricingType: item.pricingType,
    chargeBasis: item.chargeBasis,
    quantityLocked: item.quantityLocked,
  }));
  const parsed = validateCreate(body, stored);
  if (!parsed.ok) return c.json({ ok: false, error: "validation", message: parsed.message }, 400);
  const priced = await priceDraft(parsed.value);
  const requestedNo =
    typeof body === "object" && body !== null && "quotationNo" in body && typeof body.quotationNo === "string"
      ? body.quotationNo.trim()
      : "";
  const file = await buildQuotationWorkbook({
    ...parsed.value,
    quotationNo: requestedNo || "DRAFT",
    lines: priced.lines,
    total: priced.total,
  }, await sharedCatalogText());
  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  c.header("Content-Disposition", 'attachment; filename="quotation.xlsx"');
  return c.body(new Uint8Array(file));
});

app.get("/api/quotations/:id/excel", async (c) => {
  const quotation = await getQuotation(c.req.param("id"));
  if (!quotation) return c.json({ ok: false, error: "not_found", message: "Quotation not found." }, 404);
  const file = await buildQuotationWorkbook(quotation, await sharedCatalogText());
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
  const items = (await listItems()).map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    unitPrice: item.unitPrice,
    pricingType: item.pricingType,
    chargeBasis: item.chargeBasis,
    quantityLocked: item.quantityLocked,
  }));
  const parsed = validateCreate(body, items);
  if (!parsed.ok) return c.json({ ok: false, error: "validation", message: parsed.message }, 400);
  const quotation = await createQuotation(parsed.value);
  return c.json({ ok: true, quotation }, 201);
});
