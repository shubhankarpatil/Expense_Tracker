'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { StatCard } from '@/components/StatCard';
import { BudgetProgress } from '@/components/BudgetProgress';
import { CategoryDonut } from '@/components/CategoryDonut';
import { SpendTrend } from '@/components/SpendTrend';
import { SheetSetup } from '@/components/SheetSetup';
import { BudgetEditor } from '@/components/BudgetEditor';
import { MonthPicker } from '@/components/MonthPicker';
import { AnnualOverview } from '@/components/AnnualOverview';
import { formatINR } from '@/lib/format';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  type Budget,
  type CategoryStat,
  type DailyPoint,
  type MonthSummary,
  type SheetConfig,
  type Transaction,
} from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function todayYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function computeDashboard(
  transactions: Transaction[],
  yearMonth: string, // 'YYYY-MM'
) {
  const [year, month] = yearMonth.split('-').map(Number);
  const totalDays = daysInMonth(year, month);
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayDay = isCurrentMonth ? now.getDate() : totalDays;
  const daysLeft = isCurrentMonth ? totalDays - now.getDate() : 0;

  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);

  // Category stats
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  for (const t of transactions) totals[t.category] += t.amount;
  const categoryStats: CategoryStat[] = CATEGORIES.filter((c) => totals[c] > 0).map((c) => ({
    category: c,
    total: totals[c],
    percent: totalSpent > 0 ? (totals[c] / totalSpent) * 100 : 0,
    color: CATEGORY_COLORS[c],
  }));

  // Daily cumulative spend (up to today for current month, full month for past)
  const byDay: Record<number, number> = {};
  for (const t of transactions) {
    const day = parseInt(t.date.slice(8, 10), 10);
    byDay[day] = (byDay[day] ?? 0) + t.amount;
  }
  let running = 0;
  const dailyPoints: DailyPoint[] = [];
  for (let d = 1; d <= todayDay; d++) {
    running += byDay[d] ?? 0;
    dailyPoints.push({ day: d, cumulative: running });
  }

  return { totalSpent, categoryStats, dailyPoints, totalDays, daysLeft, isCurrentMonth, todayDay };
}

// ── main component ────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'setup' | 'ready' | 'error';

export default function DashboardPage() {
  const supabase = createClient();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [budget, setBudget] = useState<Budget>({ monthly_limit: null });
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(todayYearMonth);

  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [dailyPoints, setDailyPoints] = useState<DailyPoint[]>([]);
  const [totalDays, setTotalDays] = useState(30);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  const [todayDay, setTodayDay] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [annualMonths, setAnnualMonths] = useState<MonthSummary[]>([]);

  // ── fetch sheet data ────────────────────────────────────────────────────────

  const fetchAnnualData = useCallback(async (sheetId: string) => {
    const res = await fetch(`/api/sheets?sheetId=${encodeURIComponent(sheetId)}&mode=annual`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to fetch annual data');
    setAnnualMonths(json.months);
  }, []);

  const fetchSheetData = useCallback(async (sheetId: string, month: string) => {
    const res = await fetch(
      `/api/sheets?sheetId=${encodeURIComponent(sheetId)}&month=${month}`,
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to fetch sheet data');

    const transactions: Transaction[] = json.transactions;
    const computed = computeDashboard(transactions, month);
    setTotalSpent(computed.totalSpent);
    setCategoryStats(computed.categoryStats);
    setDailyPoints(computed.dailyPoints);
    setTotalDays(computed.totalDays);
    setDaysLeft(computed.daysLeft);
    setIsCurrentMonth(computed.isCurrentMonth);
    setTodayDay(computed.todayDay);
  }, []);

  // ── initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [budgetRes, sheetRes] = await Promise.all([
        supabase.from('budgets').select('monthly_limit').eq('user_id', user.id).maybeSingle(),
        supabase.from('sheet_configs').select('sheet_id, sheet_url').eq('user_id', user.id).maybeSingle(),
      ]);

      if (!budgetRes.data) {
        await supabase.from('budgets').insert({ user_id: user.id, monthly_limit: null });
      } else {
        setBudget({ monthly_limit: budgetRes.data.monthly_limit });
      }

      if (!sheetRes.data?.sheet_id) {
        setLoadState('setup');
        return;
      }

      setSheetConfig({ sheet_id: sheetRes.data.sheet_id, sheet_url: sheetRes.data.sheet_url });

      try {
        await Promise.all([
          fetchSheetData(sheetRes.data.sheet_id, selectedMonth),
          fetchAnnualData(sheetRes.data.sheet_id),
        ]);
        setLoadState('ready');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setLoadState('error');
      }
    }

    init().catch((err) => {
      setErrorMsg(err.message ?? 'Initialisation failed');
      setLoadState('error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when month changes (after initial load)
  useEffect(() => {
    if (loadState !== 'ready' || !sheetConfig) return;
    setRefreshing(true);
    fetchSheetData(sheetConfig.sheet_id, selectedMonth)
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load month');
        setLoadState('error');
      })
      .finally(() => setRefreshing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // ── handlers ────────────────────────────────────────────────────────────────

  async function handleSheetSave(url: string) {
    const sheetId = extractSheetId(url);
    if (!sheetId || !userId) throw new Error('Invalid URL or not signed in');

    const { error } = await supabase.from('sheet_configs').upsert({
      user_id: userId,
      sheet_id: sheetId,
      sheet_url: url,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);

    setSheetConfig({ sheet_id: sheetId, sheet_url: url });
    setLoadState('loading');
    try {
      await fetchSheetData(sheetId, selectedMonth);
      setLoadState('ready');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to read sheet');
      setLoadState('error');
    }
  }

  async function handleBudgetSave(limit: number) {
    if (!userId) return;
    const { error } = await supabase.from('budgets').upsert({
      user_id: userId,
      monthly_limit: limit,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
    setBudget({ monthly_limit: limit });
  }

  async function handleRefresh() {
    if (!sheetConfig || refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSheetData(sheetConfig.sheet_id, selectedMonth),
        fetchAnnualData(sheetConfig.sheet_id),
      ]);
      await supabase
        .from('sheet_configs')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Refresh failed');
      setLoadState('error');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  // ── derived values ───────────────────────────────────────────────────────────

  const limit = budget.monthly_limit ?? 0;
  const remaining = limit - totalSpent;

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-page">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <h1 className="text-base font-medium text-zinc-100">Expense dashboard</h1>
        <div className="flex items-center gap-3">
          <BudgetEditor currentLimit={budget.monthly_limit} onSave={handleBudgetSave} />
          {loadState === 'ready' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh from sheet"
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-surface hover:text-zinc-300 disabled:opacity-50"
            >
              <RefreshIcon spinning={refreshing} />
            </button>
          )}
          {sheetConfig && (
            <button
              onClick={() => setLoadState('setup')}
              className="hidden rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-surface hover:text-zinc-300 sm:block"
            >
              Change sheet
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-surface hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-5 pb-12 sm:px-8">
        {loadState === 'loading' && (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            Loading…
          </div>
        )}

        {loadState === 'setup' && (
          <SheetSetup
            onSave={handleSheetSave}
            onCancel={sheetConfig ? () => setLoadState('ready') : undefined}
          />
        )}

        {loadState === 'error' && (
          <div className="mx-auto mt-16 max-w-md rounded-xl border border-red-800/50 bg-red-950/30 px-6 py-5">
            <p className="text-sm font-medium text-red-400">Something went wrong</p>
            <p className="mt-1 text-sm text-red-300/70">{errorMsg}</p>
            <div className="mt-4 flex gap-3">
              {sheetConfig && (
                <button
                  onClick={() => { setLoadState('loading'); handleRefresh(); }}
                  className="rounded-lg bg-red-900/50 px-4 py-2 text-sm text-red-300 hover:bg-red-900"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => setLoadState('setup')}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500"
              >
                Change sheet
              </button>
            </div>
          </div>
        )}

        {loadState === 'ready' && (
          <div className="mx-auto max-w-5xl space-y-4">
            {/* Month picker */}
            <div className="flex items-center justify-between">
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                max={todayYearMonth()}
              />
              {refreshing && (
                <span className="text-xs text-zinc-500">Loading…</span>
              )}
            </div>

            {!limit && (
              <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-400">
                Set a monthly budget using the button in the top bar to see budget tracking.
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label={isCurrentMonth ? 'Spent this month' : 'Total spent'}
                value={formatINR(totalSpent)}
              />
              <StatCard
                label="Budget remaining"
                value={limit ? formatINR(Math.max(remaining, 0)) : '—'}
                sub={limit && remaining < 0 ? `Over by ${formatINR(-remaining)}` : undefined}
              />
              <StatCard
                label={isCurrentMonth ? 'Days left' : 'Days in month'}
                value={isCurrentMonth ? String(daysLeft) : String(totalDays)}
                sub={`of ${totalDays} days`}
              />
            </div>

            {limit > 0 && (
              <BudgetProgress spent={totalSpent} limit={limit} daysLeft={daysLeft} />
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CategoryDonut stats={categoryStats} />
              <SpendTrend
                dailyPoints={dailyPoints}
                budgetLimit={limit}
                daysInMonth={totalDays}
                todayDay={todayDay}
                yearMonth={selectedMonth}
              />
            </div>

            {annualMonths.length > 0 && (
              <AnnualOverview months={annualMonths} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}
