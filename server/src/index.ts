import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { ensureReady } from "./db.ts";

void ensureReady();

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, hostname: "127.0.0.1", port }, (info) => {
  console.log(`API listening on http://127.0.0.1:${info.port}`);
});
