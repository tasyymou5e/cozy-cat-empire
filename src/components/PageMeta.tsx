import { Helmet } from 'react-helmet-async';

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

/**
 * Per-route head metadata: unique title, description, self-referencing
 * canonical and og:url, plus matching Open Graph / Twitter tags.
 */
export function PageMeta({ title, description, path, image = DEFAULT_IMAGE, noindex }: PageMetaProps) {
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}

export default PageMeta;
