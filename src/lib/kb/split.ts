// #4471 split by what each report shows, counted the desk's way.
// causes.ts files every report by tenant and channel: `parser` or `hint` (CauseTable). Reports the
// desk read as a one-day move (desk-notes.json, `oneDayMove`) stay counted where they are filed,
// as CauseTable does. But a one-day move is not a day/month swap: it is a problem of its own,
// `day-shift`, so it gets its own row and its own ticket instead of a footnote.
import { groupByCause, readAs, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'day-shift' | 'unplaced';

export type ProblemRow = {
  problem: Problem;
  reports: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Reports of this row that the desk also counts under another row.
  alsoIn?: { problem: Problem; reports: number };
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: number; rows: ProblemRow[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const rows: ProblemRow[] = groupByCause(merged, tenantOf).map((g) => ({
    problem: g.cause,
    reports: g.reports.length,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
  }));

  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const days = moved.map((r) => r.receivedAt.slice(0, 10)).sort();
    const filedUnder = groupByCause(merged, tenantOf).find((g) => readAs(g, oneDayMove) > 0);
    rows.push({
      problem: 'day-shift',
      reports: moved.length,
      tenants: new Set(moved.map((r) => r.tenant)).size,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
      alsoIn: filedUnder ? { problem: filedUnder.cause, reports: readAs(filedUnder, oneDayMove) } : undefined,
    });
  }
  return { merged: merged.length, rows };
}
