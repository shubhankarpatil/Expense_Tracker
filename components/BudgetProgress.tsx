import { formatINR } from '@/lib/format';

interface BudgetProgressProps {
  spent: number;
  limit: number;
  daysLeft: number;
}

export function BudgetProgress({ spent, limit, daysLeft }: BudgetProgressProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOver = spent > limit;
  const isWarning = !isOver && pct >= 90;

  const barColor = isOver
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-green-400';

  const labelColor = isOver
    ? 'text-red-400'
    : isWarning
      ? 'text-amber-400'
      : 'text-green-400';

  const statusText = isOver
    ? `Over budget — exceeded by ${formatINR(spent - limit)}`
    : isWarning
      ? `Approaching limit — ${pct.toFixed(0)}% used, ${daysLeft} days remaining`
      : `On track — ${pct.toFixed(0)}% used, ${daysLeft} days remaining`;

  return (
    <div className="rounded-xl bg-surface px-5 py-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-100">Monthly budget</p>
        <p className="text-sm text-zinc-400 font-numeric">
          {formatINR(spent)} of {formatINR(limit)}
        </p>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-2 text-sm ${labelColor}`}>{statusText}</p>
    </div>
  );
}
