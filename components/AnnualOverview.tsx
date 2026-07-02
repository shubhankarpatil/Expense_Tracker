'use client';

import { CATEGORIES, CATEGORY_COLORS, type CategoryStat, type MonthSummary } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { StatCard } from '@/components/StatCard';
import { CategoryDonut } from '@/components/CategoryDonut';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface AnnualOverviewProps {
  months: MonthSummary[];
}

export function AnnualOverview({ months }: AnnualOverviewProps) {
  const totalYear = months.reduce((s, m) => s + m.total, 0);
  const monthsWithData = months.filter((m) => m.total > 0);
  const avgMonthly = monthsWithData.length > 0 ? totalYear / monthsWithData.length : 0;

  const biggestMonth = months.length > 0
    ? months.reduce((best, m) => (m.total > best.total ? m : best), months[0])
    : null;

  const categoryTotals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  for (const m of months) {
    for (const cat of CATEGORIES) categoryTotals[cat] += m.byCategory[cat] ?? 0;
  }
  const topCategory = totalYear > 0
    ? CATEGORIES.reduce((best, c) => (categoryTotals[c] > categoryTotals[best] ? c : best), CATEGORIES[0])
    : null;

  const yearCategoryStats: CategoryStat[] = CATEGORIES
    .filter((c) => categoryTotals[c] > 0)
    .map((c) => ({
      category: c,
      total: categoryTotals[c],
      percent: totalYear > 0 ? (categoryTotals[c] / totalYear) * 100 : 0,
      color: CATEGORY_COLORS[c],
    }));

  // "Jul 2025" → "Jul '25"
  const shortLabel = (label: string) => {
    const [mon, yr] = label.split(' ');
    return `${mon} '${yr.slice(2)}`;
  };

  const barData = {
    labels: months.map((m) => shortLabel(m.label)),
    datasets: CATEGORIES.map((cat) => ({
      label: cat,
      data: months.map((m) => Math.max(0, m.byCategory[cat] ?? 0)),
      backgroundColor: CATEGORY_COLORS[cat],
      stack: 'stack',
      borderRadius: 2,
      borderSkipped: false,
    })),
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => months[items[0].dataIndex].label,
          label: (ctx) => {
            const v = ctx.raw as number;
            return v > 0 ? ` ${ctx.dataset.label}: ${formatINR(v)}` : '';
          },
          footer: (items) => {
            const total = items.reduce((s, item) => s + (item.raw as number), 0);
            return `Total: ${formatINR(total)}`;
          },
        },
        filter: (item) => (item.raw as number) > 0,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: '#27272a' },
        ticks: { color: '#71717a', font: { size: 11 }, maxRotation: 0 },
        border: { color: '#3f3f46' },
      },
      y: {
        stacked: true,
        grid: { color: '#27272a' },
        ticks: {
          color: '#71717a',
          font: { size: 11, family: 'var(--font-outfit), system-ui, sans-serif' },
          callback: (v) =>
            new Intl.NumberFormat('en-IN', {
              notation: 'compact',
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(v as number),
        },
        border: { color: '#3f3f46' },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Last 12 months</p>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total this year" value={formatINR(totalYear)} />
        <StatCard label="Monthly average" value={formatINR(avgMonthly)} />
        <StatCard
          label="Biggest month"
          value={biggestMonth && biggestMonth.total > 0 ? biggestMonth.label : '—'}
          sub={biggestMonth && biggestMonth.total > 0 ? formatINR(biggestMonth.total) : undefined}
        />
        <StatCard
          label="Top category"
          value={topCategory ?? '—'}
          sub={topCategory ? formatINR(categoryTotals[topCategory]) : undefined}
        />
      </div>

      <div className="rounded-xl bg-surface px-5 py-5">
        <p className="text-sm text-zinc-400">Spend by month</p>
        <div className="mt-4">
          <Bar data={barData} options={barOptions} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {CATEGORIES.map((cat) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              {cat}
            </span>
          ))}
        </div>
      </div>

      <CategoryDonut stats={yearCategoryStats} />
    </div>
  );
}
