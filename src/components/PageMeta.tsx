import { useEffect } from 'react';

export const SITE_URL = 'https://www.cozycatempire.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-share.jpg`;

interface PageMetaProps {
  /** Page title, kept under 60 characters including the brand suffix. */
  title: string;
  /** Unique description, 50-160 characters. */
  description: string;
  /** Route path, e.g. "/collection". Used for the canonical and og:url. */
  path: string;
  /** Absolute image URL for social previews. */
  image?: string;
  /** Keep private/player-specific pages out of search results. */
  noindex?: boolean;
}

type MetaKey = { attr: 'name' | 'property'; key: string };

function setMeta({ attr, key }: MetaKey, content: string | null) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (content === null) {
    if (el?.dataset['pageMeta'] === 'true') el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.dataset['pageMeta'] = 'true';
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    el.dataset['pageMeta'] = 'true';
    document.head.appendChild(el);
  }
  el.href = url;
}

/**
 * Per-route head metadata: unique title, description, self-referencing
 * canonical and og:url, plus matching Open Graph / Twitter tags.
 *
 * Applied on the client after hydration; the site-wide defaults live in the
 * root route's head() so crawlers always get valid metadata.
 */
export function PageMeta({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  noindex,
}: PageMetaProps) {
  const url = `${SITE_URL}${path}`;

  useEffect(() => {
    document.title = title;
    setCanonical(url);
    setMeta({ attr: 'name', key: 'description' }, description);
    setMeta({ attr: 'name', key: 'robots' }, noindex ? 'noindex, follow' : null);

    setMeta({ attr: 'property', key: 'og:title' }, title);
    setMeta({ attr: 'property', key: 'og:description' }, description);
    setMeta({ attr: 'property', key: 'og:url' }, url);
    setMeta({ attr: 'property', key: 'og:type' }, 'website');
    setMeta({ attr: 'property', key: 'og:image' }, image);

    setMeta({ attr: 'name', key: 'twitter:card' }, 'summary_large_image');
    setMeta({ attr: 'name', key: 'twitter:title' }, title);
    setMeta({ attr: 'name', key: 'twitter:description' }, description);
    setMeta({ attr: 'name', key: 'twitter:image' }, image);
  }, [title, description, url, image, noindex]);

  return null;
}

export default PageMeta;
