/**
 * A tiny in-memory stand-in for `@workspace/db` (tests only): tables are
 * proxies of column refs, and select/update evaluate eq/and/isNull filters
 * against plain rows, so ownership checks run for real without a database.
 */

type Col = { __col: true; table: string; name: string };
type Cond = { op: "eq"; col: Col; val: unknown } | { op: "isNull"; col: Col } | { op: "and"; conds: Array<Cond | undefined> } | { op: "in"; col: Col; vals: unknown[] } | { op: "sql" };

export const tables: Record<string, Array<Record<string, unknown>>> = {};

export function resetTables(data: Record<string, Array<Record<string, unknown>>> = {}) {
  for (const key of Object.keys(tables)) delete tables[key];
  for (const [key, rows] of Object.entries(data)) tables[key] = rows.map((row) => ({ ...row }));
}

const table = (name: string) =>
  new Proxy({} as Record<string, unknown>, {
    get: (_target, key) => (key === "__table" ? name : { __col: true, table: name, name: String(key) }),
  });

const matches = (row: Record<string, unknown>, cond: Cond | undefined): boolean => {
  if (!cond) return true;
  if (cond.op === "eq") return row[cond.col.name] === cond.val;
  if (cond.op === "isNull") return row[cond.col.name] === null || row[cond.col.name] === undefined;
  if (cond.op === "and") return cond.conds.every((c) => matches(row, c));
  if (cond.op === "in") return cond.vals.includes(row[cond.col.name]);
  return true;
};

const project = (row: Record<string, unknown>, fields?: Record<string, Col>) =>
  fields ? Object.fromEntries(Object.entries(fields).map(([key, col]) => [key, row[col.name]])) : { ...row };

function selectQuery(fields?: Record<string, Col>) {
  let from = "";
  let cond: Cond | undefined;
  const run = () => (tables[from] ?? []).filter((row) => matches(row, cond)).map((row) => project(row, fields));
  const q = {
    from(t: { __table: string }) {
      from = t.__table;
      return q;
    },
    where(c: Cond) {
      cond = c;
      return q;
    },
    innerJoin: () => q,
    orderBy: () => q,
    limit: async (n: number) => run().slice(0, n),
    then: (resolve: (rows: unknown[]) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(run()).then(resolve, reject),
  };
  return q;
}

function updateQuery(t: { __table: string }) {
  let values: Record<string, unknown> = {};
  let cond: Cond | undefined;
  const q = {
    set(v: Record<string, unknown>) {
      values = v;
      return q;
    },
    where(c: Cond) {
      cond = c;
      return q;
    },
    async returning(fields?: Record<string, Col>) {
      const hit = (tables[t.__table] ?? []).filter((row) => matches(row, cond));
      for (const row of hit) for (const [key, value] of Object.entries(values)) row[key] = typeof value === "object" && value && "op" in value ? row[key] : value;
      return hit.map((row) => project(row, fields));
    },
  };
  return q;
}

/** Inserts store plain rows (sql values are dropped); conflicts are not checked. */
function insertQuery(t: { __table: string }) {
  let inserted: Array<Record<string, unknown>> = [];
  const q = {
    values(v: Record<string, unknown> | Array<Record<string, unknown>>) {
      const rows = (Array.isArray(v) ? v : [v]).map((row) =>
        Object.fromEntries(Object.entries(row).filter(([, value]) => !(typeof value === "object" && value && "op" in value))),
      );
      (tables[t.__table] ??= []).push(...rows);
      inserted = rows;
      return q;
    },
    onConflictDoNothing: () => q,
    onConflictDoUpdate: () => q,
    async returning(fields?: Record<string, Col>) {
      return inserted.map((row) => project(row, fields));
    },
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(undefined).then(resolve, reject),
  };
  return q;
}

export const fakeDbModule = {
  db: {
    select: (fields?: Record<string, Col>) => selectQuery(fields),
    update: (t: { __table: string }) => updateQuery(t),
    insert: (t: { __table: string }) => insertQuery(t),
  },
  eq: (col: Col, val: unknown): Cond => ({ op: "eq", col, val }),
  isNull: (col: Col): Cond => ({ op: "isNull", col }),
  inArray: (col: Col, vals: unknown[]): Cond => ({ op: "in", col, vals }),
  and: (...conds: Array<Cond | undefined>): Cond => ({ op: "and", conds }),
  sql: Object.assign(() => ({ op: "sql" }), { raw: () => ({ op: "sql" }) }),
  count: () => ({ op: "sql" }),
  gte: () => ({ op: "sql" }),
  stores: table("stores"),
  sellers: table("sellers"),
  storeDesignSystems: table("storeDesignSystems"),
  aiUsageLogs: table("aiUsageLogs"),
  aiCreditLedger: table("aiCreditLedger"),
  sellerAiCredits: table("sellerAiCredits"),
  agentToolCalls: table("agentToolCalls"),
  agentPendingActions: table("agentPendingActions"),
  agentReadCounts: table("agentReadCounts"),
};
