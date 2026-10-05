import type { Database } from "better-sqlite3";

export type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T>(): Promise<{ results?: T[] }>;
      first<T>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
  exec(query: string): Promise<unknown>;
};

export type Sql = {
  all<T>(query: string, params?: unknown[]): Promise<T[]>;
  get<T>(query: string, params?: unknown[]): Promise<T | undefined>;
  run(query: string, params?: unknown[]): Promise<void>;
  exec(query: string): Promise<void>;
};

export function sqliteSql(db: Database): Sql {
  return {
    async all<T>(query: string, params: unknown[] = []): Promise<T[]> {
      return db.prepare(query).all(...params) as T[];
    },
    async get<T>(query: string, params: unknown[] = []): Promise<T | undefined> {
      return db.prepare(query).get(...params) as T | undefined;
    },
    async run(query: string, params: unknown[] = []): Promise<void> {
      db.prepare(query).run(...params);
    },
    async exec(query: string): Promise<void> {
      db.exec(query);
    },
  };
}

export function d1Sql(db: D1Like): Sql {
  return {
    async all<T>(query: string, params: unknown[] = []): Promise<T[]> {
      const result = await db.prepare(query).bind(...params).all<T>();
      return result.results ?? [];
    },
    async get<T>(query: string, params: unknown[] = []): Promise<T | undefined> {
      const row = await db.prepare(query).bind(...params).first<T>();
      return row ?? undefined;
    },
    async run(query: string, params: unknown[] = []): Promise<void> {
      await db.prepare(query).bind(...params).run();
    },
    async exec(query: string): Promise<void> {
      await db.exec(query);
    },
  };
}
