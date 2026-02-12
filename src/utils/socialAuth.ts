const GOOGLE_SDK_URL = 'https://accounts.google.com/gsi/client';
const APPLE_SDK_URL = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptMomentNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: 'popup' | 'redirect';
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: GooglePromptMomentNotification) => void) => void;
          cancel: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (options: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state: string;
          nonce: string;
          usePopup: boolean;
          responseType: string;
          responseMode: string;
        }) => void;
        signIn: () => Promise<{
          authorization?: {
            id_token?: string;
          };
        }>;
      };
    };
  }
}

const loadScript = (src: string, id: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

const randomString = (length = 32) => {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length);
};

export const getGoogleIdToken = async (): Promise<string> => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google sign-in is not configured');
  }

  await loadScript(GOOGLE_SDK_URL, 'google-gsi-client');
  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error('Google sign-in SDK unavailable');
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        googleId.cancel();
      } catch (_) {
        // Ignore cancel failures.
      }
      reject(new Error('Google sign-in timed out'));
    }, 60_000);

    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      fn();
    };

    try {
      googleId.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: (response) => {
          const credential = response?.credential;
          if (typeof credential !== 'string' || credential.trim() === '') {
            done(() => reject(new Error('Google sign-in was cancelled')));
            return;
          }
          done(() => resolve(credential));
        },
      });

      googleId.prompt((notification) => {
        if (settled) return;
        const notDisplayed = notification?.isNotDisplayed && notification.isNotDisplayed();
        const skipped = notification?.isSkippedMoment && notification.isSkippedMoment();
        if (notDisplayed || skipped) {
          done(() => reject(new Error('Google sign-in is unavailable in this browser context')));
        }
      });
    } catch (err) {
      done(() => reject(err instanceof Error ? err : new Error('Google sign-in failed')));
    }
  });
};

export const getAppleIdentityToken = async (): Promise<string> => {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Apple sign-in is not configured');
  }

  await loadScript(APPLE_SDK_URL, 'apple-signin-sdk');
  if (!window.AppleID?.auth) {
    throw new Error('Apple sign-in SDK unavailable');
  }

  window.AppleID.auth.init({
    clientId,
    scope: 'name email',
    redirectURI: redirectUri,
    state: randomString(24),
    nonce: randomString(24),
    usePopup: true,
    responseType: 'code id_token',
    responseMode: 'fragment',
  });

  const result = await window.AppleID.auth.signIn();
  const identityToken = result?.authorization?.id_token;
  if (!identityToken) {
    throw new Error('Apple sign-in was cancelled');
  }
  return identityToken;
};
