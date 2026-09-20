/**
 * @fileoverview Admin "Player Inbox" — direct messaging between admins and players.
 *
 * Left: searchable conversation list (one per player, newest activity first).
 * Right: full thread with the selected player plus a composer.
 *
 * Route: /catking/messages
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MessageSquare, Search, Send, RefreshCw, Inbox, Paperclip, X, Megaphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageAttachment } from '@/components/messages/MessageAttachment';
import { uploadMessageAttachment } from '@/lib/messageAttachments';
import { createRealtimeChannel } from '@/integrations/supabase/realtime';

interface MessageRow {
  id: string;
  player_id: string;
  sender_id: string | null;
  direction: 'to_player' | 'from_player';
  body: string;
  read_by_admin: boolean;
  read_by_player: boolean;
  created_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  broadcast_id: string | null;
}

interface PlayerLite {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  email: string | null;
}

interface Conversation {
  player: PlayerLite;
  lastMessage: MessageRow;
  unread: number;
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function fmtClock(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function nameOf(p: PlayerLite): string {
  return p.display_name || p.email || 'Unnamed player';
}

/** All messages plus the profiles they belong to. */
function useMessages() {
  return useQuery({
    queryKey: ['admin-player-messages'],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('player_messages')
        .select(
          'id, player_id, sender_id, direction, body, read_by_admin, read_by_player, created_at, attachment_url, attachment_name, attachment_type, broadcast_id',
        )
        .order('created_at', { ascending: true })
        .limit(2000);
      if (error) throw error;

      const rows = (messages ?? []) as MessageRow[];
      const ids = Array.from(new Set(rows.map((m) => m.player_id)));
      if (ids.length === 0) return { rows, players: new Map<string, PlayerLite>() };

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, email')
        .in('id', ids);
      if (profileError) throw profileError;

      const players = new Map<string, PlayerLite>(
        (profiles ?? []).map((p) => [p.id, p as PlayerLite]),
      );
      return { rows, players };
    },
    staleTime: 15000,
  });
}

/** Player directory for starting a brand-new conversation. */
function usePlayerDirectory(term: string) {
  return useQuery({
    queryKey: ['admin-message-directory', term],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, email')
        .order('display_name', { ascending: true })
        .limit(25);
      if (term.trim()) {
        const t = `%${term.trim()}%`;
        query = query.or(`display_name.ilike.${t},email.ilike.${t},username.ilike.${t}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PlayerLite[];
    },
    enabled: term.trim().length > 0,
    staleTime: 30000,
  });
}

export function AdminPlayerInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useMessages();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastFile, setBroadcastFile] = useState<File | null>(null);
  const broadcastFileRef = useRef<HTMLInputElement | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [extraPlayers, setExtraPlayers] = useState<PlayerLite[]>([]);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const directory = usePlayerDirectory(search);

  const conversations = useMemo<Conversation[]>(() => {
    if (!data) return [];
    const byPlayer = new Map<string, MessageRow[]>();
    for (const m of data.rows) {
      const list = byPlayer.get(m.player_id) ?? [];
      list.push(m);
      byPlayer.set(m.player_id, list);
    }
    const list: Conversation[] = [];
    for (const [playerId, msgs] of byPlayer) {
      const player =
        data.players.get(playerId) ??
        ({ id: playerId, display_name: null, avatar_emoji: null, email: null } as PlayerLite);
      list.push({
        player,
        lastMessage: msgs[msgs.length - 1],
        unread: msgs.filter((m) => m.direction === 'from_player' && !m.read_by_admin).length,
      });
    }
    return list.sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
    );
  }, [data]);

  const term = search.trim().toLowerCase();
  const visibleConversations = term
    ? conversations.filter(
        (c) =>
          nameOf(c.player).toLowerCase().includes(term) ||
          (c.player.email ?? '').toLowerCase().includes(term),
      )
    : conversations;

  const knownIds = new Set([...conversations.map((c) => c.player.id), ...extraPlayers.map((p) => p.id)]);
  const newContacts = (directory.data ?? []).filter((p) => !knownIds.has(p.id));

  const allPlayers = useMemo(() => {
    const map = new Map<string, PlayerLite>();
    for (const c of conversations) map.set(c.player.id, c.player);
    for (const p of extraPlayers) map.set(p.id, p);
    for (const p of directory.data ?? []) map.set(p.id, p);
    return map;
  }, [conversations, extraPlayers, directory.data]);

  const selectedPlayer = selectedId ? allPlayers.get(selectedId) ?? null : null;
  const thread = useMemo(
    () => (data && selectedId ? data.rows.filter((m) => m.player_id === selectedId) : []),
    [data, selectedId],
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  // Mark player replies as read once their thread is opened.
  useEffect(() => {
    if (!selectedId || thread.length === 0) return;
    const unreadIds = thread
      .filter((m) => m.direction === 'from_player' && !m.read_by_admin)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    void (async () => {
      const { error } = await supabase
        .from('player_messages')
        .update({ read_by_admin: true })
        .in('id', unreadIds);
      if (!error) queryClient.invalidateQueries({ queryKey: ['admin-player-messages'] });
    })();
  }, [selectedId, thread, queryClient]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length, selectedId]);

  // Live updates while the inbox is open.
  useEffect(() => {
    const channel = createRealtimeChannel('admin-player-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-player-messages'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSend = async () => {
    const body = draft.trim();
    if ((!body && !file) || !selectedId || !user?.id) return;
    setSending(true);

    let attachment: { path: string; name: string; type: string } | null = null;
    if (file) {
      try {
        attachment = await uploadMessageAttachment(file, selectedId);
      } catch (err) {
        setSending(false);
        toast.error("Couldn't attach that file", {
          description: err instanceof Error ? err.message : 'Upload failed.',
        });
        return;
      }
    }

    const { error } = await supabase.from('player_messages').insert({
      player_id: selectedId,
      sender_id: user.id,
      direction: 'to_player',
      body: (body || attachment?.name || 'Attachment').slice(0, 4000),
      attachment_url: attachment?.path ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_type: attachment?.type ?? null,
    });
    setSending(false);
    if (error) {
      toast.error('Message not sent', { description: error.message });
      return;
    }
    setDraft('');
    setFile(null);
    toast.success('Message sent');
    queryClient.invalidateQueries({ queryKey: ['admin-player-messages'] });
  };

  const handleBroadcast = async () => {
    const body = broadcastBody.trim();
    if (!body || !user?.id) return;
    setBroadcasting(true);

    let attachment: { path: string; name: string; type: string } | null = null;
    if (broadcastFile) {
      try {
        attachment = await uploadMessageAttachment(broadcastFile, 'broadcast');
      } catch (err) {
        setBroadcasting(false);
        toast.error("Couldn't attach that file", {
          description: err instanceof Error ? err.message : 'Upload failed.',
        });
        return;
      }
    }

    const { data, error } = await supabase.rpc('broadcast_player_message', {
      _body: body.slice(0, 4000),
      _attachment_url: attachment?.path ?? undefined,
      _attachment_name: attachment?.name ?? undefined,
      _attachment_type: attachment?.type ?? undefined,
    });
    setBroadcasting(false);

    if (error) {
      toast.error('Broadcast not sent', { description: error.message });
      return;
    }
    const recipients = Array.isArray(data) ? (data[0]?.recipients ?? 0) : 0;
    setBroadcastBody('');
    setBroadcastFile(null);
    setBroadcastOpen(false);
    toast.success(`Broadcast sent to ${recipients} player${recipients === 1 ? '' : 's'}`);
    queryClient.invalidateQueries({ queryKey: ['admin-player-messages'] });
  };

  const startConversation = (player: PlayerLite) => {
    setExtraPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]));
    setSelectedId(player.id);
  };

  return (
    <>
      <div className="admin-console admin-fade-in space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="admin-display text-3xl font-bold tracking-tight">Player Inbox</h1>
            <p className="text-sm text-muted-foreground">
              Message players directly and read their replies.
              {totalUnread > 0 && (
                <span className="ml-2 font-semibold text-primary">{totalUnread} unread</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setBroadcastOpen(true)}>
              <Megaphone className="mr-2 h-4 w-4" />
              Broadcast
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isRefetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] items-start">
          {/* Conversation list */}
          <div className="admin-panel flex h-[70vh] flex-col overflow-hidden rounded-xl">
            <div className="border-b p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search players…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {visibleConversations.map((c) => (
                    <button
                      key={c.player.id}
                      type="button"
                      onClick={() => setSelectedId(c.player.id)}
                      className={cn(
                        'admin-row flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors',
                        selectedId === c.player.id && 'bg-muted/60',
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                        {c.player.avatar_emoji || '😺'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{nameOf(c.player)}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {fmtRelative(c.lastMessage.created_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {c.lastMessage.direction === 'to_player' ? 'You: ' : ''}
                          {c.lastMessage.body}
                        </span>
                      </span>
                      {c.unread > 0 && (
                        <span className="ml-1 shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  ))}

                  {newContacts.length > 0 && (
                    <div className="border-b bg-muted/30 px-3 py-2">
                      <p className="admin-label text-[11px]">Start a new conversation</p>
                    </div>
                  )}
                  {newContacts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => startConversation(p)}
                      className="admin-row flex w-full items-center gap-3 border-b px-3 py-3 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                        {p.avatar_emoji || '😺'}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{nameOf(p)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                      </span>
                    </button>
                  ))}

                  {visibleConversations.length === 0 && newContacts.length === 0 && (
                    <div className="flex flex-col items-center gap-2 p-8 text-center">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                      <p className="admin-label text-xs">
                        {search ? 'No players found' : 'No conversations yet'}
                      </p>
                      {!search && (
                        <p className="text-xs text-muted-foreground">
                          Search a player above to send the first message.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="admin-panel flex h-[70vh] flex-col overflow-hidden rounded-xl">
            {!selectedPlayer ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="admin-label text-xs">Select a player to open the conversation</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                    {selectedPlayer.avatar_emoji || '😺'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{nameOf(selectedPlayer)}</p>
                    <p className="truncate text-xs text-muted-foreground">{selectedPlayer.email}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {thread.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No messages yet — say hello.
                    </p>
                  )}
                  {thread.map((m) => {
                    const fromAdmin = m.direction === 'to_player';
                    return (
                      <div
                        key={m.id}
                        className={cn('flex', fromAdmin ? 'justify-end' : 'justify-start')}
                      >
                        <div className="max-w-[80%]">
                          <div
                            className={cn(
                              'break-words rounded-2xl px-4 py-2 text-sm',
                              fromAdmin
                                ? 'bg-primary text-primary-foreground'
                                : 'admin-inset text-foreground',
                            )}
                          >
                            <span className="whitespace-pre-wrap">{m.body}</span>
                            {m.attachment_url && (
                              <MessageAttachment
                                path={m.attachment_url}
                                name={m.attachment_name}
                                type={m.attachment_type}
                              />
                            )}
                          </div>
                          <p
                            className={cn(
                              'mt-1 text-[11px] text-muted-foreground',
                              fromAdmin ? 'text-right' : 'text-left',
                            )}
                          >
                            {fmtClock(m.created_at)}
                            {fromAdmin && (m.read_by_player ? ' · read' : ' · sent')}
                            {m.broadcast_id && ' · broadcast'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>

                <div className="border-t p-3">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={`Message ${nameOf(selectedPlayer)}…`}
                    rows={3}
                    maxLength={4000}
                    className="resize-none"
                  />
                  {file && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Remove attachment"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {draft.length}/4000 · ⌘/Ctrl + Enter to send
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          setFile(e.target.files?.[0] ?? null);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Attach a file"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleSend()}
                        disabled={sending || (!draft.trim() && !file)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast to all players</DialogTitle>
            <DialogDescription>
              Everyone gets this message in their in-game inbox. Suspended accounts are skipped.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={broadcastBody}
            onChange={(e) => setBroadcastBody(e.target.value)}
            placeholder="Announcement, patch notes, event news…"
            rows={5}
            maxLength={4000}
            className="resize-none"
          />

          {broadcastFile && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{broadcastFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Remove attachment"
                onClick={() => setBroadcastFile(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <DialogFooter className="items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={broadcastFileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  setBroadcastFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => broadcastFileRef.current?.click()}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Attach
              </Button>
              <span className="text-[11px] text-muted-foreground">{broadcastBody.length}/4000</span>
            </div>
            <Button
              onClick={() => void handleBroadcast()}
              disabled={broadcasting || !broadcastBody.trim()}
            >
              <Megaphone className="mr-2 h-4 w-4" />
              {broadcasting ? 'Sending…' : 'Send to everyone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminPlayerMessages() {
  return (
    <AdminLayout>
      <AdminPlayerInbox />
    </AdminLayout>
  );
}
