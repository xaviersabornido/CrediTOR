const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const isLocalHost = (hostname) => LOCAL_HOSTS.has(hostname?.toLowerCase?.() ?? '');

const parseOrigin = (url) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/** True when this origin only works on the same machine (not on a phone). */
export const isLocalOnlyOrigin = (originOrUrl) => {
  const parsed = parseOrigin(originOrUrl);
  if (!parsed) return true;
  return isLocalHost(parsed.hostname);
};

/**
 * Base URL for QR codes and public verification links.
 *
 * Priority:
 * 1. VITE_PUBLIC_URL env var (set by detect-lan.mjs in dev, or manually in production).
 * 2. window.location.origin when running on a public domain (Vercel, Netlify, etc.).
 * 3. Falls back to whatever origin is available (including localhost for local-only dev).
 */
export const getPublicOrigin = () => {
  const fromEnv = import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, '');
  if (fromEnv && !isLocalOnlyOrigin(fromEnv)) {
    return fromEnv;
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    if (!isLocalOnlyOrigin(origin)) {
      return origin;
    }
  }

  return fromEnv || (typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '');
};

/** Public verification URL encoded in each TOR QR code (opened on mobile after scan). */
export const buildVerificationUrl = (verificationToken) => {
  const base = getPublicOrigin();

  if (!base || isLocalOnlyOrigin(base)) {
    throw new Error(
      'QR codes cannot use localhost on a phone. Stop the dev server, run "npm run dev" again (it writes your LAN IP to .env.local), then register the TOR again so the PDF gets a new QR code.'
    );
  }

  return `${base}/verify?token=${encodeURIComponent(verificationToken)}`;
};
