/**
 * @fileoverview MSW server instance for Vitest
 *
 * Provides a shared `setupServer` that all test suites can use.
 * Import and call `server.listen()` in `beforeAll`.
 */

import { setupServer } from 'msw/node';
import { supabaseHandlers } from './supabaseHandlers';

export const server = setupServer(...supabaseHandlers);
