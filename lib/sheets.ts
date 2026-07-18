import { CATEGORIES, type Category, type Transaction } from './types';

function normalizeCategory(raw: string): Category {
  const trimmed = raw.trim().toLowerCase();
  const match = CATEGORIES.find((c) => c.toLowerCase() === trimmed);
  return match ?? 'Other';
}

// Parses a sheet name like "December 2024" or "Jan 2025" into { year, month (1-based) }
export function parseSheetName(name: string): { year: number; month: number } | null {
  const months: Record<string, number> = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12,
  };

  const parts = name.trim().toLowerCase().split(/\s+/);
  if (parts.length !== 2) return null;

  const monthNum = months[parts[0]];
  const year = parseInt(parts[1], 10);

  if (!monthNum || isNaN(year)) return null;
  return { year, month: monthNum };
}

// Converts a day number (1–31) + sheet month/year into an ISO date string
function dayToISODate(day: number, year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface ParseResult {
  transactions: Transaction[];
  error?: string;
}

export function parseSheetRows(
  rows: string[][],
  yearMonth: string,         // 'YYYY-MM' — used only for single-sheet mode
  sheetContext?: { year: number; month: number }, // provided in multi-sheet mode
): ParseResult {
  if (!rows || rows.length < 2) {
    return { transactions: [], error: 'Sheet appears empty or has no data rows.' };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const dateIdx = headers.findIndex((h) => h === 'date');
  // Accept both "amount" and "amount spent"
  const amountIdx = headers.findIndex(
    (h) => h === 'amount' || h === 'amount spent',
  );
  const categoryIdx = headers.findIndex((h) => h === 'category');

  if (dateIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    const missing = [
      dateIdx === -1 && 'Date',
      amountIdx === -1 && 'Amount',
      categoryIdx === -1 && 'Category',
    ]
      .filter(Boolean)
      .join(', ');
    return {
      transactions: [],
      error: `Required column(s) not found: ${missing}. Make sure your sheet has headers named Date, Amount, and Category.`,
    };
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = (row[dateIdx] ?? '').toString().trim();
    const rawAmount = (row[amountIdx] ?? '').toString().trim();
    const rawCategory = (row[categoryIdx] ?? '').toString().trim();

    if (!rawDate && !rawAmount) continue;

    const amount = parseFloat(rawAmount.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount === 0) continue;

    let isoDate: string | null = null;

    if (sheetContext) {
      // Multi-sheet mode: Date column is just the day number (1–31)
      const day = parseInt(rawDate, 10);
      if (isNaN(day) || day < 1 || day > 31) continue;
      isoDate = dayToISODate(day, sheetContext.year, sheetContext.month);
    } else {
      // Single-sheet mode: full date in the cell
      const serial = Number(rawDate);
      if (!isNaN(serial) && serial > 1000) {
        // Google Sheets date serial
        const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
        isoDate = d.toISOString().slice(0, 10);
      } else {
        const d = new Date(rawDate);
        isoDate = isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      }
      if (!isoDate || !isoDate.startsWith(yearMonth)) continue;
    }

    if (!isoDate) continue;

    transactions.push({
      date: isoDate,
      amount,
      category: normalizeCategory(rawCategory),
    });
  }

  return { transactions };
}

// Fetches all sheet names (tabs) in the spreadsheet
export async function fetchSheetNames(
  sheetId: string,
  accessToken: string,
): Promise<{ names: string[] | null; error?: string }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (res.status === 401) return { names: null, error: 'UNAUTHORIZED' };
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.error('Sheets fetchSheetNames error:', res.status, JSON.stringify(body));
    return { names: null, error: `Sheets API error ${res.status}` };
  }

  const json = await res.json();
  const names: string[] = json.sheets?.map(
    (s: { properties: { title: string } }) => s.properties.title,
  ) ?? [];
  return { names };
}

export async function fetchSheetRows(
  sheetId: string,
  accessToken: string,
  sheetName?: string, // if provided, fetches that specific tab
): Promise<{ rows: string[][] | null; error?: string }> {
  const range = sheetName ? `'${sheetName}'!A:Z` : 'A:Z';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (res.status === 401) return { rows: null, error: 'UNAUTHORIZED' };
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    console.error('Sheets 403:', JSON.stringify(body));
    return {
      rows: null,
      error: 'Permission denied. Make sure you granted Sheets read access when signing in.',
    };
  }
  if (res.status === 404) {
    return {
      rows: null,
      error: 'Sheet not found. Check that the sheet ID is correct.',
    };
  }
  if (!res.ok) {
    const body = await res.text();
    return { rows: null, error: `Google Sheets API error ${res.status}: ${body.slice(0, 200)}` };
  }

  const json = await res.json();
  return { rows: (json.values as string[][]) ?? [] };
}

export async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ accessToken: string | null; error?: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    return { accessToken: null, error: 'Failed to refresh Google token. Please sign in again.' };
  }

  const json = await res.json();
  return { accessToken: json.access_token ?? null };
}
