/**
 * Fires conversion events to GA4 and Meta Pixel.
 * Safe to call even if tracking scripts haven't loaded.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

function ga4Event(eventName: string, params?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

function metaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

export function trackSignupCompleted(method: string = 'email') {
  ga4Event('sign_up', { method });
  metaEvent('CompleteRegistration', { content_name: method });
}

export function trackLogin(method: string = 'email') {
  ga4Event('login', { method });
  metaEvent('Lead', { content_name: 'login', content_category: method });
}
