<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  type Ticket = { label: string; href: string; state: string; open: boolean };
  // tickets: problem → its ticket and where it stands.
  let { ticket, tickets }: { ticket: number; tickets: Partial<Record<Problem, Ticket>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const WHAT: Record<Problem, string> = {
    parser: 'day and month swapped: the shared parser reads day-first dates month first',
    hint: 'day and month swapped: the booking-v3 form hints MM/DD/YYYY, then reads the date day first',
    'day-shift': 'date moved by one day, not swapped',
    unplaced: 'no tenant on file',
  };
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.rows.length}</strong>
  {split.rows.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>what the reports show</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.rows as r (r.problem)}
      {@const t = tickets[r.problem]}
      <tr class:open={t?.open}>
        <td><code>{r.problem}</code></td>
        <td>{WHAT[r.problem]}</td>
        <td><strong>{r.reports}</strong></td>
        <td>{r.tenants}</td>
        <td>{r.firstSeen} → {r.lastSeen}</td>
        <td>
          {#if t}<a href={t.href}>{t.label}</a> · <span class="state">{t.state}</span>{:else}<span class="none">none</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.rows as r (r.problem)}
  {#if r.alsoIn}
    <p class="note">The {r.reports} <code>{r.problem}</code> reports are also counted under <code>{r.alsoIn.problem}</code>, where the desk files them by tenant.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  .state { color: var(--muted); }
  .none { color: var(--warn); font-weight: 600; }
  .open td { background: var(--warn-bg); }
  .open .state { color: var(--warn); font-weight: 600; }
</style>
