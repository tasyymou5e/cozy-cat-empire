import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GameLayout } from '@/components/layouts/GameLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Send, Loader2, MessageSquare, Mail, Paperclip, X } from 'lucide-react';
import { MessageAttachment } from '@/components/messages/MessageAttachment';
import { uploadMessageAttachment } from '@/lib/messageAttachments';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PlayerMessages');

interface PlayerMessage {
  id: string;
  player_id: string;
  sender_id: string | null;
  direction: 'to_player' | 'from_player';
  body: string;
  read_by_player: boolean;
  read_by_admin: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

const MAX_BODY = 4000;

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleString();
}

/**
 * Player-facing inbox: read messages from the game team and reply.
 */
export default function PlayerMessages() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<PlayerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.direction === 'to_player' && !m.read_by_player).length,
    [messages]
  );

  // Load messages
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from('player_messages')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: true });

      if (cancelled) return;
      if (error) {
        logger.warn('Failed to load messages', error);
        toast({
          title: "Couldn't load your messages",
          description: 'Please try again in a moment.',
          variant: 'destructive',
        });
      } else {
        setMessages((data || []) as PlayerMessage[]);
      }
      setIsLoading(false);
    };

    void load();

    const channel = supabase
      .channel('player-inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'player_messages', filter: `player_id=eq.${user.id}` },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Mark incoming messages as read once seen
  useEffect(() => {
    if (!user || unreadCount === 0) return;
    const ids = messages
      .filter((m) => m.direction === 'to_player' && !m.read_by_player)
      .map((m) => m.id);
    if (ids.length === 0) return;

    void supabase
      .from('player_messages')
      .update({ read_by_player: true })
      .in('id', ids)
      .then(({ error }) => {
        if (error) {
          logger.warn('Failed to mark messages read', error);
          return;
        }
        setMessages((prev) =>
          prev.map((m) => (ids.includes(m.id) ? { ...m, read_by_player: true } : m))
        );
      });
  }, [user, unreadCount, messages]);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!user || sending) return;
    if (!body && !file) return;
    setSending(true);

    let attachment: { path: string; name: string; type: string } | null = null;
    if (file) {
      try {
        attachment = await uploadMessageAttachment(file, user.id);
      } catch (err) {
        setSending(false);
        logger.warn('Attachment upload failed', err as Error);
        toast({
          title: "Couldn't attach that file",
          description: err instanceof Error ? err.message : 'Please try a smaller file.',
          variant: 'destructive',
        });
        return;
      }
    }

    const { data, error } = await supabase
      .from('player_messages')
      .insert({
        player_id: user.id,
        sender_id: user.id,
        direction: 'from_player',
        body: (body || attachment?.name || 'Attachment').slice(0, MAX_BODY),
        read_by_player: true,
        read_by_admin: false,
        attachment_url: attachment?.path ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_type: attachment?.type ?? null,
      })
      .select()
      .single();

    setSending(false);

    if (error || !data) {
      logger.warn('Failed to send message', error);
      toast({
        title: 'Message not sent',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setMessages((prev) => [...prev, data as PlayerMessage]);
    setDraft('');
    setFile(null);
    toast({ title: 'Message sent 💌', description: 'The team will get back to you here.' });
  };

  const content = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      );
    }

    if (!user) {
      return (
        <Card className="p-8 text-center space-y-3">
          <Mail className="h-8 w-8 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">Sign in to see your messages</h2>
          <p className="text-sm text-muted-foreground">
            Your inbox keeps the conversation with the Cat Farm team in one place.
          </p>
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </Card>
      );
    }

    return (
      <>
        <Card className="p-3 sm:p-4 flex flex-col gap-3 min-h-[45vh] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <span className="text-4xl">📬</span>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Say hello below — questions, bug reports and cat photos all welcome.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.direction === 'from_player';
              return (
                <div
                  key={m.id}
                  className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      mine
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={cn(
                        'text-[11px] mt-1',
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {mine ? 'You' : '🐱 Cat Farm team'} • {fmtWhen(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </Card>

        <Card className="p-3 sm:p-4 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Write a message to the Cat Farm team…"
            maxLength={MAX_BODY}
            className="min-h-[90px] resize-none text-base"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {draft.length}/{MAX_BODY} • ⌘/Ctrl + Enter to send
            </span>
            <Button
              onClick={() => void handleSend()}
              disabled={!draft.trim() || sending}
              className="min-h-[44px] gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </Card>
      </>
    );
  };

  return (
    <GameLayout currentPage="/messages">
      <main className="flex-1 p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-4 pb-24">
        <header className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Chat with the Cat Farm team right inside the game.
            </p>
          </div>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
        </header>

        {content()}
      </main>
    </GameLayout>
  );
}
