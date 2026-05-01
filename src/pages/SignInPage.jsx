import { useState, useEffect } from 'react';
import { C, alpha } from '../tokens';
import { useAuth } from '../context/AuthContext';

// Editorial wordmark — replaces the raster logo on the sign-in page. The
// PNG has a built-in beige plate that smears on themed backgrounds (sage,
// gold, teal, etc.) under the global `mix-blend-mode: multiply`. This
// type-only mark reads like a masthead: tracked-uppercase "THE" modifier
// above an italic Playfair display title, an accent rule, then the
// brand's tagline. Renders crisply on every theme.
function Wordmark({ size = 'lg', align = 'left' }) {
  const px = size === 'lg' ? 1 : 0.78;
  const center = align === 'center';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: center ? 'center' : 'flex-start',
      textAlign: center ? 'center' : 'left',
      gap: 0,
    }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12 * px, fontWeight: 600,
        letterSpacing: '0.32em', textTransform: 'uppercase',
        color: C.accent,
        marginBottom: 8 * px,
      }}>The</span>
      <h1 style={{
        margin: 0,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 44 * px, fontWeight: 700, fontStyle: 'italic',
        letterSpacing: '-0.02em', lineHeight: 1.04,
        color: C.fg1,
      }}>
        New <span style={{ color: C.accent }}>Beginnings</span>
      </h1>
      <span aria-hidden="true" style={{
        display: 'block',
        width: 56 * px, height: 2,
        background: C.accent,
        borderRadius: 1,
        margin: `${14 * px}px 0 ${10 * px}px`,
      }} />
      <p style={{
        margin: 0,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 16 * px, fontStyle: 'italic',
        color: C.fg2,
        lineHeight: 1.5,
        letterSpacing: '0.005em',
      }}>
        A fresh start. Endless possibilities.
      </p>
    </div>
  );
}

const FEATURES = [
  { icon: '💡', label: 'Ideas',     desc: 'Capture and evaluate venture ideas' },
  { icon: '📋', label: 'Plans',     desc: 'Build structured business plans' },
  { icon: '🚀', label: 'Projects',  desc: 'Track active ventures and KPIs' },
  { icon: '📄', label: 'Documents', desc: 'Store and read PDFs and reports' },
];

export default function SignInPage() {
  const { signInWithGoogle, accessDenied, verifyError, retryAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Reset button loading state when auth context settles (access denied or
  // network verify error), so the user can interact with the page again.
  useEffect(() => {
    if (accessDenied || verifyError) setLoading(false);
  }, [accessDenied, verifyError]);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      // Surface the Firebase error code so we can diagnose iOS Safari /
      // popup-blocker / third-party-cookie failures instead of always
      // showing the same generic message.
      const code = err?.code || '';
      console.error('[auth/signIn]', code, err?.message);
      let msg;
      if (code === 'auth/popup-blocked') {
        msg = /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
          ? 'Safari blocked the sign-in popup. Go to Settings → Safari and turn off "Block Pop-ups", then try again.'
          : 'Sign-in popup was blocked. Allow popups for this site and try again.';
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        msg = 'Sign-in was cancelled. Tap "Continue with Google" to try again.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network error. Check your connection and try again.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized for sign-in. Contact the workspace admin.';
      } else if (code === 'auth/internal-error') {
        msg = 'Internal sign-in error. Try clearing site data and sign in again.';
      } else {
        msg = code ? `Sign-in failed (${code}). Please try again.` : 'Sign-in failed. Please try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex', minHeight: '100vh', background: C.bg0 }}>

      {/* Left panel — branding (desktop only) */}
      <div style={{ display: 'none', flex: 1, background: C.accentBg, borderRight: `1px solid ${C.border}`, padding: '60px 48px', flexDirection: 'column', justifyContent: 'space-between' }} className="show-on-desktop">
        {/* Wordmark + main content grouped so there's no dead gap between them */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <Wordmark size="lg" />
          <div>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: C.fg1, lineHeight: 1.35, marginBottom: 16 }}>
              Your private workspace for Rajahmundry ventures.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: C.fg2, lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
              Capture ideas rooted in the Godavari and Konaseema region, build business plans,
              track projects, and manage documents — all in one place.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bg0, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: C.fg1 }}>{f.label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, marginTop: 1 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
          Rajahmundry · Godavari · Konaseema
        </div>
      </div>

      {/* Right panel — sign in */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="auth-card" style={{ width: '100%', maxWidth: 380, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Wordmark — mobile/iPad only (left panel renders its own on desktop) */}
          <div className="hide-on-desktop" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <Wordmark size="sm" align="center" />
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, margin: '0 0 8px 0' }}>Sign in</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, margin: 0 }}>
              Access your private venture workspace.
            </p>
          </div>

          <button onClick={handleSignIn} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '14px 20px', borderRadius: 8, border: `1.5px solid ${C.borderLight}`, background: loading ? C.bg1 : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 500, color: C.fg1, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', transition: 'all 150ms' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {accessDenied && !error && (
            <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.danger, marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
              Access denied. Your account hasn't been invited to this workspace.<br />
              <span style={{ fontSize: 13, color: C.fg3 }}>Contact the workspace admin to request access — once added, click below to retry.</span>
              <div style={{ marginTop: 10 }}>
                <button onClick={handleSignIn} disabled={loading}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', padding: '6px 16px' }}>
                  {loading ? 'Retrying…' : 'Try again'}
                </button>
              </div>
            </div>
          )}
          {verifyError && !error && (
            <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
              Couldn't verify your account — connection issue.
              <span style={{ display: 'block', fontSize: 13, color: C.fg3, marginTop: 4 }}>
                You won't need to sign in with Google again.
              </span>
              <div style={{ marginTop: 10 }}>
                <button onClick={() => retryAuth()} disabled={loading}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', padding: '6px 16px' }}>
                  {loading ? 'Retrying…' : 'Retry →'}
                </button>
              </div>
            </div>
          )}
          {error && (
            <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.danger, marginTop: 12, textAlign: 'center' }}>{error}</div>
          )}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '24px 0 0 0' }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
            🔒 Your data is stored privately. No one else can see it.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, margin: '8px 0 0', textAlign: 'center', letterSpacing: '0.04em' }}>
            By invitation only · Rajahmundry
          </p>
        </div>
      </div>
    </div>
  );
}
