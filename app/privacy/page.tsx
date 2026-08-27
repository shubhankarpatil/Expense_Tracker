import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy · Expense Tracker',
  description: 'Privacy Policy for Expense Tracker — how we handle your data.',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#18181b', color: '#fafafa', fontFamily: 'var(--font-outfit, system-ui, sans-serif)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #27272a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#fafafa' }}>Expense Tracker</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#a1a1aa', textDecoration: 'none' }}>← Back to Home</Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fafafa', marginBottom: 8 }}>Privacy Policy — Expense Tracker</h1>
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 40 }}>Last updated: August 2026</p>

        <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.8, marginBottom: 40 }}>
          We respect your privacy and are committed to protecting your personal information.
        </p>

        <Section title="What we access">
          When you connect your Google Sheet to our service, we access and read the data in your Google Sheet solely to
          display your expense dashboard and provide the requested functionality. Your raw Google Sheet data is never
          copied or cached on our servers.
        </Section>

        <Section title="What we store">
          We store only your monthly budget limit and the URL of your connected Google Sheet in order to provide the
          service across sessions. We do not store your transaction or expense data on our servers.
        </Section>

        <Section title="How we use your data">
          Your Google Sheet data is not used for advertising, profiling, or any purpose unrelated to providing the
          expense dashboard. We only access the Google Sheet data necessary to provide the service you request.
        </Section>

        <Section title="Third parties">
          We do not sell, rent, or share your transaction data with third parties for their own purposes.
        </Section>

        <Section title="Revoking access">
          You may revoke our access to your Google account or Google Sheets at any time through your Google Account
          settings at{' '}
          <a
            href="https://myaccount.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3b82f6' }}
          >
            myaccount.google.com
          </a>
          . Once access is revoked, we will no longer be able to retrieve data from your Google Sheet.
        </Section>

        <Section title="Contact">
          If you have any questions about this privacy policy, please contact us at{' '}
          <a href="mailto:shuhbspatil77@gmail.com" style={{ color: '#3b82f6' }}>
            shuhbspatil77@gmail.com
          </a>
          .
        </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', marginBottom: 12 }}>{title}</h2>
      <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.8, margin: 0 }}>{children}</p>
    </section>
  );
}
