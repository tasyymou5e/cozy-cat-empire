import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Create a realtime channel for `topic`, dropping any channel that is still
 * registered under the same topic first.
 *
 * `supabase.channel(topic)` hands back the *existing* channel when one is
 * already registered, and calling `.on(...)` on a channel that has already been
 * subscribed throws. That happens whenever a subscribing effect remounts before
 * the asynchronous `removeChannel` cleanup of the previous mount has completed.
 */
export function createRealtimeChannel(topic: string): RealtimeChannel {
  for (const existing of supabase.getChannels()) {
    if (existing.topic === `realtime:${topic}`) {
      supabase.removeChannel(existing);
    }
  }
  return supabase.channel(topic);
}
