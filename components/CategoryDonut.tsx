'use client';

import { useRef } from 'react';
import { CATEGORY_COLORS, type CategoryStat } from '@/lib/types';
import { formatINR } from '@/lib/format';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

interface CategoryDonutProps {
  stats: CategoryStat[];
  totalSpent: number;
}

type HoverState = { label: string; amount: number; percent: number } | null;

function makeCenterTextPlugin(hoverRef: React.MutableRefObject<HoverState>): Plugin<'doughnut'> {
  return {
    id: 'centerText',
    beforeDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const hovered = hoverRef.current;

      if (hovered) {
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText(hovered.label, cx, cy - 17);

        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillStyle = '#fafafa';
        ctx.fillText(formatINR(hovered.amount), cx, cy + 1);

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#71717a';
        ctx.fillText(`${hovered.percent.toFixed(0)}% of total`, cx, cy + 18);
      } else {
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillStyle = '#52525b';
        ctx.fillText('hover a slice', cx, cy);
      }

      ctx.restore();
    },
  };
}

export function CategoryDonut({ stats }: CategoryDonutProps) {
  const hoverRef = useRef<HoverState>(null);
  const filtered = stats.filter((s) => s.total > 0);

  const plugin = makeCenterTextPlugin(hoverRef);

  const data = {
    labels: filtered.map((s) => s.category),
    datasets: [
      {
        data: filtered.map((s) => s.total),
        backgroundColor: filtered.map((s) => CATEGORY_COLORS[s.category]),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    onHover: (_event, elements, chart) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        hoverRef.current = {
          label: filtered[idx].category,
          amount: filtered[idx].total,
          percent: filtered[idx].percent,
        };
      } else {
        hoverRef.current = null;
      }
      chart.draw();
    },
  };

  return (
    <div className="rounded-xl bg-surface px-5 py-5">
      <p className="text-sm text-zinc-400">Spend by category</p>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto w-44 flex-shrink-0 sm:mx-0">
          <Doughnut data={data} options={options} plugins={[plugin]} />
        </div>

        <ul className="flex flex-col gap-2.5 min-w-0">
          {filtered.map((s) => (
            <li key={s.category} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[s.category] }}
              />
              <span className="text-zinc-200 truncate">{s.category}</span>
              <span className="ml-auto flex-shrink-0 w-8 text-right text-zinc-400">
                {s.percent.toFixed(0)}%
              </span>
              <span className="flex-shrink-0 w-20 text-right text-zinc-300 font-medium font-numeric">
                {formatINR(s.total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
