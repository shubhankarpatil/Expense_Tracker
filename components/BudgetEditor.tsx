'use client';

import { formatINR } from '@/lib/format';
import { useState } from 'react';

interface BudgetEditorProps {
  currentLimit: number | null;
  onSave: (limit: number) => Promise<void>;
}

export function BudgetEditor({ currentLimit, onSave }: BudgetEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentLimit ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(num);
      setEditing(false);
    } catch {
      setError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(String(currentLimit ?? ''));
          setEditing(true);
        }}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-surface hover:text-zinc-200"
      >
        <PencilIcon />
        {currentLimit ? `Budget: ${formatINR(currentLimit)}` : 'Set monthly budget'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">₹</span>
      <input
        autoFocus
        type="number"
        min="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-36 rounded-lg bg-surface border border-zinc-600 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-400"
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {saving ? '…' : 'Save'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
      >
        Cancel
      </button>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  );
}
