'use client';

import { type DailyPoint } from '@/lib/types';
import { formatINR } from '@/lib/format';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface SpendTrendProps {
  dailyPoints: DailyPoint[];
  budgetLimit: number;
  daysInMonth: number;
  todayDay: number;
  yearMonth: string; // 'YYYY-MM'
}

const ORDINALS = ['', '1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th',
  '11th','12th','13th','14th','15th','16th','17th','18th','19th','20th',
  '21st','22nd','23rd','24th','25th','26th','27th','28th','29th','30th','31st'];

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

export function SpendTrend({ dailyPoints, budgetLimit, daysInMonth, todayDay, yearMonth }: SpendTrendProps) {
  // Build day labels 1..daysInMonth
  const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Build cumulative spend array — null for future days
  const spendData = labels.map((day) => {
    if (day > todayDay) return null;
    const pt = dailyPoints.find((p) => p.day === day);
    // Use the last known value for days with no transactions
    if (!pt) {
      // find last point at or before this day
      const last = dailyPoints.filter((p) => p.day <= day).at(-1);
      return last?.cumulative ?? 0;
    }
    return pt.cumulative;
  });

  // Budget reference line — constant across all days
  const budgetLine = labels.map(() => (budgetLimit > 0 ? budgetLimit : null));

  const data = {
    labels: labels.map((d) => (d === 1 || d === daysInMonth || d % 5 === 0 ? `Day ${d}` : '')),
    datasets: [
      {
        label: 'Cumulative spend',
        data: spendData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: labels.map((d) => (d === todayDay ? 4 : 0)),
        pointHoverRadius: 5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#18181b',
        pointBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Budget limit',
        data: budgetLine,
        borderColor: '#71717a',
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const day = items[0].dataIndex + 1;
            const monthIdx = parseInt(yearMonth.slice(5, 7), 10) - 1;
            return `${ORDINALS[day]} ${MONTH_NAMES[monthIdx]}`;
          },
          label: (ctx) => ` ${ctx.dataset.label}: ${formatINR(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#27272a' },
        ticks: { color: '#71717a', font: { size: 11 }, maxRotation: 0 },
        border: { color: '#3f3f46' },
      },
      y: {
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
    <div className="rounded-xl bg-surface px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">Spend vs budget</p>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded bg-blue-500" />
            Cumulative spend
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-5 rounded"
              style={{
                background:
                  'repeating-linear-gradient(to right, #71717a 0,#71717a 6px,transparent 6px,transparent 10px)',
              }}
            />
            Budget limit
          </span>
        </div>
      </div>
      <div className="mt-4">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
