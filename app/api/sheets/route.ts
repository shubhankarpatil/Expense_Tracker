import { createClient } from '@/lib/supabase-server';
import {
  fetchSheetNames,
  fetchSheetRows,
  parseSheetName,
  parseSheetRows,
  refreshGoogleToken,
} from '@/lib/sheets';
import { CATEGORIES, type Category, type MonthSummary } from '@/lib/types';
import { NextResponse } from 'next/server';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function emptyByCategory(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const providerRefreshToken = session.provider_refresh_token;

  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('sheetId');
  const yearMonth = searchParams.get('month'); // YYYY-MM
  const mode = searchParams.get('mode');

  if (!sheetId) {
    return NextResponse.json({ error: 'Missing sheetId parameter' }, { status: 400 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  const currentYearMonth =
    yearMonth ?? `${year}-${String(month).padStart(2, '0')}`;

  let accessToken = session.provider_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No Google access token. Please sign out and sign in again.' },
      { status: 401 },
    );
  }

  // Helper: attempt token refresh on 401
  async function withTokenRefresh<T>(
    fn: (token: string) => Promise<{ error?: string } & T>,
  ): Promise<({ error?: string } & T) | NextResponse> {
    let result = await fn(accessToken!);
    if (result.error === 'UNAUTHORIZED' && providerRefreshToken) {
      const refreshed = await refreshGoogleToken(providerRefreshToken);
      if (!refreshed.accessToken) {
        return NextResponse.json(
          { error: 'Session expired. Please sign out and sign in again.' },
          { status: 401 },
        );
      }
      accessToken = refreshed.accessToken;
      result = await fn(accessToken);
    }
    return result;
  }

  // 1. Get all tab names
  const namesResult = await withTokenRefresh((token) =>
    fetchSheetNames(sheetId, token),
  );
  if (namesResult instanceof NextResponse) return namesResult;
  if (namesResult.error || !namesResult.names) {
    return NextResponse.json({ error: namesResult.error ?? 'Could not read sheet tabs' }, { status: 400 });
  }

  // ── Annual mode: fetch last 12 months in parallel ────────────────────────────
  if (mode === 'annual') {
    const last12: { year: number; month: number; yearMonth: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      last12.push({
        year: y,
        month: m,
        yearMonth: `${y}-${String(m).padStart(2, '0')}`,
        label: `${MONTH_SHORT[m - 1]} ${y}`,
      });
    }

    const months: MonthSummary[] = await Promise.all(
      last12.map(async ({ year: y, month: m, yearMonth: ym, label }) => {
        const tab = namesResult.names!.find((name) => {
          const parsed = parseSheetName(name);
          return parsed?.year === y && parsed?.month === m;
        });

        if (!tab) return { yearMonth: ym, label, total: 0, byCategory: emptyByCategory() };

        const rowsResult = await withTokenRefresh((token) =>
          fetchSheetRows(sheetId, token, tab),
        );
        if (rowsResult instanceof NextResponse || rowsResult.error || !rowsResult.rows) {
          return { yearMonth: ym, label, total: 0, byCategory: emptyByCategory() };
        }

        const { transactions } = parseSheetRows(rowsResult.rows, ym, { year: y, month: m });
        const byCategory = emptyByCategory();
        let total = 0;
        for (const t of transactions) {
          byCategory[t.category] += t.amount;
          total += t.amount;
        }
        return { yearMonth: ym, label, total, byCategory };
      }),
    );

    return NextResponse.json({ months });
  }

  // ── Single month mode ────────────────────────────────────────────────────────

  // 2. Find the tab matching the requested month
  const targetYear = parseInt(currentYearMonth.slice(0, 4), 10);
  const targetMonth = parseInt(currentYearMonth.slice(5, 7), 10);

  const matchingTab = namesResult.names.find((name) => {
    const parsed = parseSheetName(name);
    return parsed?.year === targetYear && parsed?.month === targetMonth;
  });

  if (!matchingTab) {
    // No tab for this month — return empty (not an error, user just has no data yet)
    return NextResponse.json({ transactions: [], month: currentYearMonth });
  }

  // 3. Fetch rows from the matching tab
  const rowsResult = await withTokenRefresh((token) =>
    fetchSheetRows(sheetId, token, matchingTab),
  );
  if (rowsResult instanceof NextResponse) return rowsResult;
  if (rowsResult.error || !rowsResult.rows) {
    return NextResponse.json({ error: rowsResult.error ?? 'Could not read sheet data' }, { status: 400 });
  }

  // 4. Parse — multi-sheet mode (Date column = day number only)
  const { transactions, error } = parseSheetRows(
    rowsResult.rows,
    currentYearMonth,
    { year: targetYear, month: targetMonth },
  );

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const todayYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const availableMonths = namesResult.names
    .map((name) => {
      const parsed = parseSheetName(name);
      if (!parsed) return null;
      return `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
    })
    .filter((ym): ym is string => ym !== null && ym <= todayYM)
    .sort();

  return NextResponse.json({ transactions, month: currentYearMonth, availableMonths });
}
