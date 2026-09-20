/**
 * @fileoverview Shared chainable Supabase client mock factory
 *
 * Provides a fully chainable mock that supports:
 *  - Query builder chains: .from().select/insert/update/upsert/delete().eq().order().limit().single()/maybeSingle()
 *  - Realtime channels: .channel().on().on()...subscribe()
 *  - Storage: .storage.from().upload/download/remove/getPublicUrl()
 *  - Auth: .auth.getUser/signOut/signInWithPassword/onAuthStateChange()
 *  - RPC: .rpc()
 *
 * All terminal calls resolve to `{ data: null|[], error: null }` by default.
 * Tests can override behavior via `setQueryResult(table, result)` or by
 * grabbing the underlying vi.fn() instances exposed on the returned object.
 */

import { vi, type Mock } from 'vitest';

export interface SupabaseMockResult<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export interface SupabaseMock {
  /** The mocked supabase client (use as drop-in replacement) */
  client: Record<string, unknown>;
  /** vi.fn() for `.from(table)` — inspect calls per table */
  from: Mock;
  /** vi.fn() for `.channel(name)` */
  channel: Mock;
  /** vi.fn() for `.removeChannel()` */
  removeChannel: Mock;
  /** vi.fn() for `.rpc(fn, args)` */
  rpc: Mock;
  /** Set the default resolved value for any terminal query method */
  setDefaultResult: <T = unknown>(result: SupabaseMockResult<T>) => void;
  /** Set per-table override (matches first call to `.from(table)`) */
  setTableResult: <T = unknown>(table: string, result: SupabaseMockResult<T>) => void;
  /** Reset all mocks and overrides */
  reset: () => void;
}

/**
 * Build a chainable query builder where every method returns `this` (a thenable
 * proxy) and terminal calls resolve to the configured result.
 */
function createQueryBuilder(getResult: () => SupabaseMockResult): any {
  const result = () => Promise.resolve(getResult());

  const builder: any = {
    // Filter / modifier methods — return self for chaining
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    in: vi.fn(() => builder),
    is: vi.fn(() => builder),
    or: vi.fn(() => builder),
    and: vi.fn(() => builder),
    not: vi.fn(() => builder),
    like: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    containedBy: vi.fn(() => builder),
    match: vi.fn(() => builder),
    filter: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    // Terminal methods — resolve to result
    single: vi.fn(result),
    maybeSingle: vi.fn(result),
    csv: vi.fn(result),
    // Make builder thenable so `await supabase.from(...).select().eq(...)` works
    then: (resolve: (v: SupabaseMockResult) => unknown, reject?: (e: unknown) => unknown) =>
      result().then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => result().catch(reject),
    finally: (cb: () => void) => result().finally(cb),
  };

  return builder;
}

function createChannel(): any {
  const channel: any = {
    on: vi.fn(() => channel),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      cb?.('SUBSCRIBED');
      return channel;
    }),
    unsubscribe: vi.fn(() => Promise.resolve('ok')),
    send: vi.fn(() => Promise.resolve('ok')),
    track: vi.fn(() => Promise.resolve('ok')),
    untrack: vi.fn(() => Promise.resolve('ok')),
  };
  return channel;
}

function createStorageBucket(): any {
  return {
    upload: vi.fn(() => Promise.resolve({ data: { path: 'mock-path' }, error: null })),
    download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
    remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
    list: vi.fn(() => Promise.resolve({ data: [], error: null })),
    getPublicUrl: vi.fn((path: string) => ({
      data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${path}` },
    })),
    createSignedUrl: vi.fn(() =>
      Promise.resolve({ data: { signedUrl: 'https://mock.signed' }, error: null })
    ),
  };
}

export function createSupabaseMock(): SupabaseMock {
  const defaultResult: SupabaseMockResult = { data: [], error: null };
  let currentDefault: SupabaseMockResult = defaultResult;
  const tableOverrides = new Map<string, SupabaseMockResult>();

  const from = vi.fn((table: string) => {
    return createQueryBuilder(() => tableOverrides.get(table) ?? currentDefault);
  });

  const channel = vi.fn(() => createChannel());
  const removeChannel = vi.fn(() => Promise.resolve('ok'));
  const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

  const auth = {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })
    ),
    getSession: vi.fn(() =>
      Promise.resolve({
        data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
        error: null,
      })
    ),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    signInWithPassword: vi.fn(() =>
      Promise.resolve({ data: { user: null, session: null }, error: null })
    ),
    signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  };

  const storage = {
    from: vi.fn(() => createStorageBucket()),
  };

  const functions = {
    invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };

  const client = { from, channel, removeChannel, rpc, auth, storage, functions };

  return {
    client,
    from,
    channel,
    removeChannel,
    rpc,
    setDefaultResult: (result) => {
      currentDefault = result as SupabaseMockResult;
    },
    setTableResult: (table, result) => {
      tableOverrides.set(table, result as SupabaseMockResult);
    },
    reset: () => {
      currentDefault = defaultResult;
      tableOverrides.clear();
      from.mockClear();
      channel.mockClear();
      removeChannel.mockClear();
      rpc.mockClear();
    },
  };
}

/** A singleton instance used by the global setup mock. Tests can import & override. */
export const globalSupabaseMock = createSupabaseMock();
