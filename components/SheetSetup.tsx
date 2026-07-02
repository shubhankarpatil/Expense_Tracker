'use client';

import { useState } from 'react';

interface SheetSetupProps {
  onSave: (url: string) => Promise<void>;
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export function SheetSetup({ onSave }: SheetSetupProps) {
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
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">Connect your Google Sheet</h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Open your expense sheet in Google Sheets and paste the URL from your browser.
            Your sheet must have columns named <strong className="text-zinc-300">Date</strong>,{' '}
            <strong className="text-zinc-300">Amount</strong>, and{' '}
            <strong className="text-zinc-300">Category</strong>.
          </p>
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
