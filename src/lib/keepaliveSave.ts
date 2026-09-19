/**
 * @fileoverview keepaliveSave - Last-chance cloud save during tab close / backgrounding.
 *
 * Normal async saves cannot be trusted while a page is unloading: the browser
 * may kill pending promises. This module keeps a cached access token so we can
 * fire a single `fetch(..., { keepalive: true })` upsert against the REST API,
 * which the browser is obliged to finish even after the tab goes away.
 *
 * @module lib/keepaliveSave
 */

import { supabase } from '@/integrations/supabase/client';
import type { GameState } from '@/types/game';
import { createLogger } from '@/lib/logger';

const log = createLogger('KeepaliveSave');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

let cachedToken: string | null = null;
let isWatching = false;

/** Keep a synchronously-readable copy of the access token for unload-time saves. */
export function startTokenCache() {
  if (isWatching) return;
  isWatching = true;

  supabase.auth.getSession().then(({ data }) => {
    cachedToken = data.session?.access_token ?? null;
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token ?? null;
  });
}

interface KeepaliveSavePayload {
  userId: string;
  gameState: GameState;
  kittensBreed: number;
  relationships: unknown;
}

/**
 * Fire-and-forget upsert that survives tab close. Returns false when it could
 * not even be dispatched (no token, unsafe state), so callers can fall back.
 */
export function keepaliveCloudSave({
  userId,
  gameState,
  kittensBreed,
  relationships,
}: KeepaliveSavePayload): boolean {
  if (!userId || !cachedToken || !SUPABASE_URL || !SUPABASE_KEY) return false;

  // Mirror the data-loss guards used by the regular cloud save path.
  if (gameState.cats.length === 0) return false;

  try {
    const body = JSON.stringify({
      user_id: userId,
      game_state: gameState,
      kittens_bred: kittensBreed,
      relationships,
      last_played_at: new Date().toISOString(),
    });

    // Browsers cap keepalive request bodies at ~64 KB; bail out so the caller
    // can fall back to a regular save instead of silently dropping the request.
    if (body.length > 60_000) {
      log.debug('Payload too large for keepalive save', { bytes: body.length });
      return false;
    }

    void fetch(`${SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${cachedToken}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body,
    }).catch((err) => log.debug('Keepalive save request failed', err));

    log.debug('Keepalive save dispatched');
    return true;
  } catch (err) {
    log.error('Keepalive save could not be dispatched', err);
    return false;
  }
}
