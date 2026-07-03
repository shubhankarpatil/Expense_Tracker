'use client';

interface MonthPickerProps {
  value: string;        // 'YYYY-MM'
  onChange: (month: string) => void;
  min?: string;         // don't go before this month
  max?: string;         // don't go beyond this month (defaults to current)
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthPicker({ value, onChange, min, max }: MonthPickerProps) {
  const [year, month] = value.split('-').map(Number);

  const maxValue = max ?? new Date().toISOString().slice(0, 7);
  const [maxYear, maxMonth] = maxValue.split('-').map(Number);

  const isAtMax = year === maxYear && month === maxMonth;
  const isAtMin = min ? value <= min : false;

  function prev() {
    if (isAtMin) return;
    const d = new Date(year, month - 2);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  function next() {
    if (isAtMax) return;
    const d = new Date(year, month);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        disabled={isAtMin}
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-surface hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        title="Previous month"
      >
        <ChevronLeft />
      </button>

      <span className="min-w-[140px] text-center text-sm font-medium text-zinc-200">
        {MONTH_NAMES[month - 1]} {year}
      </span>

      <button
        onClick={next}
        disabled={isAtMax}
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-surface hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        title="Next month"
      >
        <ChevronRight />
      </button>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
