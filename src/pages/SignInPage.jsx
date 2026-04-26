import { useState } from 'react';
import { C } from '../tokens';
import { useAuth } from '../context/AuthContext';
const logoImg = `${import.meta.env.BASE_URL}logo.png`;

const FEATURES = [
  { icon: '💡', label: 'Ideas',     desc: 'Capture and evaluate venture ideas' },
  { icon: '📋', label: 'Plans',     desc: 'Build structured business plans' },
  { icon: '🚀', label: 'Projects',  desc: 'Track active ventures and KPIs' },
  { icon: '📄', label: 'Documents', desc: 'Store and read PDFs and reports' },
];

export default function SignInPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg0 }}>

      {/* Left panel — branding (desktop only) */}
      <div style={{ display: 'none', flex: 1, background: C.accentBg, borderRight: `1px solid ${C.border}`, padding: '60px 48px', flexDirection: 'column', justifyContent: 'space-between' }} className="show-on-desktop">
        <img src={logoImg} alt="The New Beginnings" style={{ height: 48, width: 'auto', mixBlendMode: 'multiply' }} />

        <div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: C.fg1, lineHeight: 1.35, marginBottom: 16 }}>
            Your private workspace for Rajahmundry ventures.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
            Capture ideas rooted in the Godavari and Konaseema region, build business plans,
            track projects, and manage documents — all in one place.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bg0, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1 }}>{f.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, marginTop: 1 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
          Rajahmundry · Godavari · Konaseema
        </div>
      </div>

      {/* Right panel — sign in */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Logo — mobile */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src={logoImg} alt="The New Beginnings" style={{ height: 52, width: 'auto', mixBlendMode: 'multiply', marginBottom: 12 }} className="hide-on-desktop" />
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: C.fg1, margin: '0 0 8px 0' }}>Sign in</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, margin: 0 }}>
              Access your private venture workspace.
            </p>
          </div>

          <button onClick={handleSignIn} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '13px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: loading ? C.bg1 : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.fg1, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', transition: 'all 150ms' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)'; }}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && (
            <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, marginTop: 12, textAlign: 'center' }}>{error}</div>
          )}

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 28, textAlign: 'center', lineHeight: 1.6 }}>
            Your data is stored privately.<br />No one else can see it.
          </p>
        </div>
      </div>
    </div>
  );
}
