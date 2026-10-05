import { AsyncLocalStorage } from "node:async_hooks";
import type { Sql } from "./sql.ts";

export type RequestContext = {
  sql: Sql;
  template?: ArrayBuffer;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(context, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}
