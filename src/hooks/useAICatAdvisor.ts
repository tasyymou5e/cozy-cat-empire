import { useState, useCallback } from 'react';
import { Cat, GameState } from '@/types/game';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const log = createLogger('AICatAdvisor');

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cat-ai-assistant`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface NameSuggestion {
  name: string;
  meaning: string;
}

interface Tip {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

async function callAI(body: Record<string, unknown>) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (resp.status === 429) {
    toast.error('AI rate limit reached. Try again in a moment.');
    throw new Error('rate_limited');
  }
  if (resp.status === 402) {
    toast.error('AI credits exhausted. Please add more credits.');
    throw new Error('credits_exhausted');
  }
  if (!resp.ok) throw new Error('AI request failed');
  return resp;
}

export function useAICatAdvisor() {
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Name state
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [isNamesLoading, setIsNamesLoading] = useState(false);

  // Story state
  const [generatedStory, setGeneratedStory] = useState('');
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  // Tips state
  const [tips, setTips] = useState<Tip[]>([]);
  const [isTipsLoading, setIsTipsLoading] = useState(false);

  const sendChatMessage = useCallback(
    async (input: string) => {
      const userMsg: ChatMessage = { role: 'user', content: input };
      setChatMessages((prev) => [...prev, userMsg]);
      setIsChatLoading(true);

      let assistantSoFar = '';
      const allMessages = [...chatMessages, userMsg];

      try {
        const resp = await callAI({ action: 'chat', messages: allMessages });
        if (!resp.body) throw new Error('No stream body');

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                const snapshot = assistantSoFar;
                setChatMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: snapshot } : m
                    );
                  }
                  return [...prev, { role: 'assistant', content: snapshot }];
                });
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                const snapshot = assistantSoFar;
                setChatMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: snapshot } : m
                    );
                  }
                  return [...prev, { role: 'assistant', content: snapshot }];
                });
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg !== 'rate_limited' && msg !== 'credits_exhausted') {
          log.error('Failed to get AI response:', e);
          toast.error('Failed to get AI response');
        }
      } finally {
        setIsChatLoading(false);
      }
    },
    [chatMessages]
  );

  const generateNames = useCallback(async (cat: Cat) => {
    setIsNamesLoading(true);
    setNameSuggestions([]);
    try {
      const resp = await callAI({
        action: 'name',
        breed: cat.breed,
        personality: cat.personality,
        appearance: cat.appearance,
      });
      const data = await resp.json();
      setNameSuggestions(data.names || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg !== 'rate_limited' && msg !== 'credits_exhausted') {
        log.error('Failed to generate names:', e);
        toast.error('Failed to generate names');
      }
    } finally {
      setIsNamesLoading(false);
    }
  }, []);

  const generateStory = useCallback(async (cat: Cat) => {
    setIsStoryLoading(true);
    setGeneratedStory('');
    try {
      const resp = await callAI({
        action: 'story',
        name: cat.name,
        breed: cat.breed,
        personality: cat.personality,
        grade: cat.grade,
        showWins: cat.showWins,
        tricksLearned: cat.tricksLearned,
        appearance: cat.appearance,
      });
      const data = await resp.json();
      setGeneratedStory(data.story || '');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg !== 'rate_limited' && msg !== 'credits_exhausted') {
        log.error('Failed to generate story:', e);
        toast.error('Failed to generate story');
      }
    } finally {
      setIsStoryLoading(false);
    }
  }, []);

  const generateTips = useCallback(async (state: GameState) => {
    setIsTipsLoading(true);
    setTips([]);
    try {
      const resp = await callAI({
        action: 'tips',
        money: state.money,
        day: state.day,
        catCount: state.cats.length,
        space: state.space,
        houseSize: state.houseSize,
        resources: state.resources,
        totalShowWins: state.totalShowWins,
        acres: state.acres,
        breedingCooldown: state.breedingCooldown,
      });
      const data = await resp.json();
      setTips(data.tips || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg !== 'rate_limited' && msg !== 'credits_exhausted') {
        log.error('Failed to generate tips:', e);
        toast.error('Failed to generate tips');
      }
    } finally {
      setIsTipsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => setChatMessages([]), []);

  const restoreMessages = useCallback((msgs: ChatMessage[]) => {
    setChatMessages(msgs);
  }, []);

  return {
    // Chat
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChat,
    restoreMessages,
    // Names
    nameSuggestions,
    isNamesLoading,
    generateNames,
    // Story
    generatedStory,
    isStoryLoading,
    generateStory,
    // Tips
    tips,
    isTipsLoading,
    generateTips,
  };
}
