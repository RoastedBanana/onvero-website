'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';
import { hasConsent } from '../app-shell/CookieConsent';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  return hasConsent();
}

function getServerSnapshot() {
  return false;
}

export function AnalyticsLoader() {
  const consentGiven = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!consentGiven) return null;

  return (
    <>
      <Script src="https://plausible.io/js/pa-kKZb9OGJJyFPeOOINz23w.js" strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
      </Script>
    </>
  );
}
