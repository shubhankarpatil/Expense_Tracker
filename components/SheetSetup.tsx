'use client';

import { useState } from 'react';

interface SheetSetupProps {
  onSave: (url: string) => Promise<void>;
  onCancel?: () => void;
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export function SheetSetup({ onSave, onCancel }: SheetSetupProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const id = extractSheetId(url.trim());
    if (!id) {
      setError('Paste the full URL from your browser — it should contain /spreadsheets/d/…');
      return;
    }

    setSaving(true);
    try {
      await onSave(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </button>
        )}

        <div>
          <h2 className="text-xl font-semibold text-zinc-50">Connect your Google Sheet</h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Open your expense sheet in Google Sheets and paste the URL from your browser.
            Your sheet must have columns named <strong className="text-zinc-300">Date</strong>,{' '}
            <strong className="text-zinc-300">Amount</strong>, and{' '}
            <strong className="text-zinc-300">Category</strong>.
          </p>
          <a
            href="https://docs.google.com/spreadsheets/d/118iYFWfhLDITYQcKztjtxF9kemKkTqEuOIrnGfRh70Y/copy?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-400 transition-colors hover:text-blue-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Don't have a sheet? Start from our template
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="sheet-url" className="text-sm text-zinc-300">
              Sheet URL
            </label>
            <input
              id="sheet-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="w-full rounded-xl bg-surface border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving || !url.trim()}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Connecting…' : 'Connect sheet'}
          </button>
        </form>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-500">
          The app reads your sheet on every page load using the read-only Google access you
          granted at sign-in. It never modifies your sheet.
        </div>
      </div>
    </div>
  );
}
