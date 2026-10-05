import template from "../templates/quotation.xlsx";
import { app } from "./app.ts";
import { runWithContext } from "./context.ts";
import { d1Sql, type D1Like } from "./sql.ts";

export type Env = {
  DB: D1Like;
  CORS_ORIGINS?: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (env.CORS_ORIGINS) process.env.CORS_ORIGINS = env.CORS_ORIGINS;
    return runWithContext({ sql: d1Sql(env.DB), template }, async () => app.fetch(request));
  },
};
