'use client';

import { createClient } from '@/lib/supabase-browser';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#18181b' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #27272a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#fafafa' }}>Expense Tracker</span>
        </div>
        <Link href="/privacy" style={{ fontSize: 13, color: '#a1a1aa', textDecoration: 'none' }}>Privacy Policy</Link>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 640, width: '100%', textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1d4ed8', borderRadius: 999, padding: '4px 12px', marginBottom: 24 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#93c5fd"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 500 }}>Free · Open Source · Privacy First</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#fafafa', lineHeight: 1.15, marginBottom: 16 }}>
            Your Google Sheet,<br />
            <span style={{ color: '#3b82f6' }}>your expense dashboard.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 0 }}>
            Expense Tracker turns your existing Google Sheet into a beautiful, real-time expense dashboard — with charts, budgets, and monthly breakdowns. No data is copied or stored. Your sheet stays yours.
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, maxWidth: 640, width: '100%', marginBottom: 48 }}>
          {[
            { icon: '📊', title: 'Live Charts', desc: 'Spending trends & category breakdowns' },
            { icon: '🎯', title: 'Budget Tracking', desc: 'Set limits and track progress per category' },
            { icon: '🔒', title: 'Read-Only Access', desc: 'We never write to or store your data' },
            { icon: '📅', title: 'Monthly View', desc: 'Browse any month with a single click' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#27272a', borderRadius: 12, padding: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#fafafa', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Sign-in card */}
        <div style={{ width: '100%', maxWidth: 360 }}>
          {error && (
            <div style={{ background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#f87171' }}>
              Sign-in failed. Please try again.
            </div>
          )}

          <div style={{ background: '#27272a', borderRadius: 16, padding: 32 }}>
            <h2 style={{ fontWeight: 600, fontSize: 16, color: '#fafafa', marginBottom: 8 }}>Get started for free</h2>
            <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24, lineHeight: 1.6 }}>
              Sign in with Google to connect your spreadsheet. We&apos;ll only request <strong style={{ color: '#a1a1aa' }}>read-only</strong> access to Google Sheets.
            </p>

            <button
              id="google-signin-btn"
              onClick={signIn}
              style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 12, background: '#3f3f46', border: 'none', padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#fafafa', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#52525b')}
              onMouseLeave={e => (e.currentTarget.style.background = '#3f3f46')}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginTop: 16 }}>
              By continuing, you agree to our{' '}
              <Link href="/privacy" style={{ color: '#71717a', textDecoration: 'underline' }}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #27272a', padding: '16px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#52525b' }}>
          © {new Date().getFullYear()} Expense Tracker ·{' '}
          <Link href="/privacy" style={{ color: '#71717a', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#18181b' }} />}>
      <LoginContent />
    </Suspense>
  );
}
