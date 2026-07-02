import { createClient } from '@/lib/supabase-server';
import {
  fetchSheetNames,
  fetchSheetRows,
  parseSheetName,
  parseSheetRows,
  refreshGoogleToken,
} from '@/lib/sheets';
import { NextResponse } from 'next/server';

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

  // 2. Find the tab matching the current month (e.g. "June 2026")
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

  return NextResponse.json({ transactions, month: currentYearMonth });
}
