import { useLocation } from 'react-router-dom';
import { PageMeta } from './PageMeta';

interface RouteMetaEntry {
  title: string;
  description: string;
  noindex?: boolean;
}

/**
 * Per-route head metadata. Public game pages get unique, indexable
 * titles/descriptions; player-specific and admin pages are noindexed.
 */
const ROUTE_META: Record<string, RouteMetaEntry> = {
  '/': {
    title: 'Cozy Cat Empire — Free Cat Farm Game',
    description:
      'Play Cozy Cat Empire free in your browser: take in strays, care for cats, win cat shows and grow from a tiny apartment to a 100-acre cat farm.',
  },
  '/collection': {
    title: 'Cat Collection — Cozy Cat Empire',
    description:
      'Browse your collectible cat cards across all eight breeds, from scrappy strays to rare Bengals, with grades, stats and holographic frames.',
  },
  '/gallery': {
    title: 'Cat Photo Gallery — Cozy Cat Empire',
    description:
      'View photos made in the Cozy Cat Empire photo booth: backgrounds, poses, frames and stickers for every cat on your farm.',
  },
  '/relationships': {
    title: 'Cat Relationships — Cozy Cat Empire',
    description:
      'See which of your cats are best friends, rivals or soul mates, and how their bonds change breeding success and daily happiness.',
  },
  '/leaderboard': {
    title: 'Global Leaderboard — Cozy Cat Empire',
    description:
      'See the top Cozy Cat Empire players ranked by cat show wins, cats owned, kittens bred, days survived and total money earned.',
  },
  '/stats': {
    title: 'Player Stats — Cozy Cat Empire',
    description:
      'Track your Cozy Cat Empire progress: cats owned, best grades, show wins, kittens bred, money earned and global rankings.',
  },
  '/empire': {
    title: 'Your Cat Empire — Cozy Cat Empire',
    description:
      'Watch your cats roam your animated farm, with seasonal scenery, costumes and rare-cat glow effects across every housing upgrade.',
  },
  '/photobooth': {
    title: 'Cat Photo Booth — Cozy Cat Empire',
    description:
      'Pose your cats with backgrounds, frames and stickers in the Cozy Cat Empire photo booth, then save or share the photo.',
  },
  '/customize': {
    title: 'Customize Your Cat — Cozy Cat Empire',
    description:
      'Choose fur colour, pattern, eye colour, hair length and facial features to make each of your cats look one of a kind.',
  },
  '/auth': {
    title: 'Log In or Sign Up — Cozy Cat Empire',
    description: 'Create a free Cozy Cat Empire account to save your cats to the cloud, trade with friends and join the leaderboards.',
    noindex: true,
  },
  '/portal': {
    title: 'My Portal — Cozy Cat Empire',
    description: 'Your Cozy Cat Empire portal: team messages, profile, your cats, stats and leaderboard standings.',
    noindex: true,
  },
  '/messages': {
    title: 'Messages — Cozy Cat Empire',
    description: 'Read and reply to messages from the Cozy Cat Empire team.',
    noindex: true,
  },
};

const FALLBACK: RouteMetaEntry = {
  title: 'Cozy Cat Empire — Free Cat Farm Game',
  description:
    'Play Cozy Cat Empire free in your browser: raise cats, win cat shows, breed kittens and grow your own cat farm.',
  noindex: true,
};

function resolveMeta(pathname: string): RouteMetaEntry {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  // Dynamic routes such as /photobooth/:catId and /customize/:catId
  const base = `/${pathname.split('/').filter(Boolean)[0] ?? ''}`;
  if (ROUTE_META[base]) return ROUTE_META[base];
  return FALLBACK;
}

export function RouteMeta() {
  const { pathname } = useLocation();
  const meta = resolveMeta(pathname);
  const canonicalPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  return (
    <PageMeta
      title={meta.title}
      description={meta.description}
      path={canonicalPath}
      noindex={meta.noindex}
    />
  );
}

export default RouteMeta;
