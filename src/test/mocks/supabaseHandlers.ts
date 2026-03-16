/**
 * @fileoverview MSW request handlers for Supabase REST API
 *
 * Intercepts HTTP calls to the Supabase PostgREST endpoint so tests
 * exercise the real @supabase/supabase-js client without hitting the network.
 *
 * @module test/mocks/supabaseHandlers
 */

import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://bkkluziuyystiqkcpbnd.supabase.co';
const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

// ── State stores (reset between tests) ───────────────────────────────────

export const stores = {
  profiles: new Map<string, Record<string, unknown>>(),
  gameSaves: new Map<string, Record<string, unknown>>(),
  playerStats: new Map<string, Record<string, unknown>>(),
  catGifts: [] as Record<string, unknown>[],
  tradeOffers: [] as Record<string, unknown>[],
  errorLogs: [] as Record<string, unknown>[],
};

export function resetStores() {
  stores.profiles.clear();
  stores.gameSaves.clear();
  stores.playerStats.clear();
  stores.catGifts.length = 0;
  stores.tradeOffers.length = 0;
  stores.errorLogs.length = 0;
}

// ── Handlers ─────────────────────────────────────────────────────────────

export const supabaseHandlers = [
  // ── Auth ──────────────────────────────────────────────────────────────

  http.post(`${AUTH}/token`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-id',
        email: body.email ?? 'test@example.com',
        role: 'authenticated',
      },
    });
  }),

  http.post(`${AUTH}/signup`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const userId = `user-${Math.random().toString(36).slice(2, 10)}`;
    return HttpResponse.json({
      id: userId,
      email: body.email,
      role: 'authenticated',
    });
  }),

  http.get(`${AUTH}/user`, () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'authenticated',
    });
  }),

  // ── Profiles ──────────────────────────────────────────────────────────

  http.get(`${REST}/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const idFilter = url.searchParams.get('id');
    if (idFilter) {
      const id = idFilter.replace('eq.', '');
      const profile = stores.profiles.get(id);
      return HttpResponse.json(profile ? [profile] : []);
    }
    return HttpResponse.json(Array.from(stores.profiles.values()));
  }),

  http.post(`${REST}/profiles`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rows = Array.isArray(body) ? body : [body];
    for (const row of rows) {
      stores.profiles.set(row.id as string, row);
    }
    return HttpResponse.json(rows, { status: 201 });
  }),

  http.patch(`${REST}/profiles`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const url = new URL(request.url);
    const idFilter = url.searchParams.get('id');
    if (idFilter) {
      const id = idFilter.replace('eq.', '');
      const existing = stores.profiles.get(id) ?? {};
      stores.profiles.set(id, { ...existing, ...body });
      return HttpResponse.json([stores.profiles.get(id)]);
    }
    return HttpResponse.json([], { status: 200 });
  }),

  // ── Game Saves ────────────────────────────────────────────────────────

  http.get(`${REST}/game_saves`, ({ request }) => {
    const url = new URL(request.url);
    const userFilter = url.searchParams.get('user_id');
    if (userFilter) {
      const userId = userFilter.replace('eq.', '');
      const save = stores.gameSaves.get(userId);
      return HttpResponse.json(save ? [save] : []);
    }
    return HttpResponse.json(Array.from(stores.gameSaves.values()));
  }),

  http.post(`${REST}/game_saves`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rows = Array.isArray(body) ? body : [body];
    for (const row of rows) {
      stores.gameSaves.set(row.user_id as string, row);
    }
    return HttpResponse.json(rows, { status: 201 });
  }),

  // ── Player Stats ──────────────────────────────────────────────────────

  http.get(`${REST}/player_stats`, ({ request }) => {
    const url = new URL(request.url);
    const userFilter = url.searchParams.get('user_id');
    if (userFilter) {
      const userId = userFilter.replace('eq.', '');
      const stats = stores.playerStats.get(userId);
      return HttpResponse.json(stats ? [stats] : []);
    }
    return HttpResponse.json(Array.from(stores.playerStats.values()));
  }),

  http.post(`${REST}/player_stats`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rows = Array.isArray(body) ? body : [body];
    for (const row of rows) {
      stores.playerStats.set(row.user_id as string, row);
    }
    return HttpResponse.json(rows, { status: 201 });
  }),

  // ── Cat Gifts ─────────────────────────────────────────────────────────

  http.get(`${REST}/cat_gifts`, ({ request }) => {
    const url = new URL(request.url);
    const recipientFilter = url.searchParams.get('recipient_id');
    if (recipientFilter) {
      const id = recipientFilter.replace('eq.', '');
      return HttpResponse.json(stores.catGifts.filter((g) => g.recipient_id === id));
    }
    return HttpResponse.json(stores.catGifts);
  }),

  http.post(`${REST}/cat_gifts`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rows = Array.isArray(body) ? body : [body];
    stores.catGifts.push(...rows);
    return HttpResponse.json(rows, { status: 201 });
  }),

  // ── Trade Offers ──────────────────────────────────────────────────────

  http.get(`${REST}/trade_offers`, () => {
    return HttpResponse.json(stores.tradeOffers);
  }),

  http.post(`${REST}/trade_offers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rows = Array.isArray(body) ? body : [body];
    stores.tradeOffers.push(...rows);
    return HttpResponse.json(rows, { status: 201 });
  }),

  // ── Error Logs ────────────────────────────────────────────────────────

  http.post(`${REST}/error_logs`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const rows = Array.isArray(body) ? body : [body];
    stores.errorLogs.push(...rows);
    return HttpResponse.json(rows, { status: 201 });
  }),

  // ── Realtime (no-op for REST tests) ───────────────────────────────────

  http.get(`${SUPABASE_URL}/realtime/v1/*`, () => {
    return HttpResponse.json({});
  }),

  // ── Catch-all for unhandled PostgREST routes ──────────────────────────

  http.all(`${REST}/*`, () => {
    return HttpResponse.json([], { status: 200 });
  }),
];
