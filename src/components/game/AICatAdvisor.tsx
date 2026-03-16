import { useState, useRef, useEffect } from 'react';
import { useAICatAdvisor } from '@/hooks/useAICatAdvisor';
import { Cat, GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

interface AICatAdvisorProps {
  cats: Cat[];
  state: GameState;
  onRenameCat?: (catId: string, name: string) => void;
  onSaveBackstory?: (catId: string, backstory: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const QUICK_PROMPTS = [
  { label: '🎯 What next?', prompt: 'What should I do next?' },
  { label: '🐱 Cats needing care?', prompt: 'Which of my cats need attention right now?' },
  { label: '💕 Best breeding pair?', prompt: 'What is the best breeding pair right now?' },
  { label: '💰 Earn fast?', prompt: 'How can I earn money fast?' },
];

const CHAT_HISTORY_KEY = 'cat-farm-ai-chat-history';
const MAX_HISTORY = 20;

export function AICatAdvisor({ cats, state, onRenameCat, onSaveBackstory, onNavigateTab }: AICatAdvisorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ai = useAICatAdvisor();

  const selectedCat = cats.find((c) => c.id === selectedCatId);

  // Load persistent chat history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          ai.restoreMessages(parsed.slice(-MAX_HISTORY));
        }
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist chat messages
  useEffect(() => {
    if (ai.chatMessages.length > 0) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(ai.chatMessages.slice(-MAX_HISTORY)));
      } catch { /* ignore */ }
    }
  }, [ai.chatMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ai.chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim() || ai.isChatLoading) return;
    ai.sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const priorityConfig = {
    high: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔴' },
    medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '🟡' },
    low: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🟢' },
  };

  return (
    <>
      {/* Floating AI Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-[7.5rem] right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30 flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform animate-pulse hover:animate-none"
            aria-label="AI Cat Advisor"
          >
            🤖
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col max-h-screen">
          <SheetHeader className="p-4 pb-2 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🐱</span>
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-bold">
                Whiskers AI Advisor
              </span>
            </SheetTitle>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-2 grid grid-cols-4">
              <TabsTrigger value="chat" className="text-xs">💬 Chat</TabsTrigger>
              <TabsTrigger value="names" className="text-xs">✨ Names</TabsTrigger>
              <TabsTrigger value="stories" className="text-xs">📖 Stories</TabsTrigger>
              <TabsTrigger value="tips" className="text-xs">💡 Tips</TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <ScrollArea className="flex-1 p-4">
                {ai.chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <span className="text-5xl block mb-3">🐱</span>
                    <p className="font-medium">Meow! I'm Whiskers.</p>
                    <p className="text-sm mt-1">Ask me anything about your cat farm!</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {['How do I win cat shows?', 'Best breeding strategy?', 'How to earn more money?'].map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setChatInput(q);
                            ai.sendChatMessage(q);
                          }}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {ai.chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        {msg.role === 'assistant' && <span className="text-xs font-medium text-muted-foreground block mb-1">🐱 Whiskers</span>}
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5 [&>p:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {ai.isChatLoading && ai.chatMessages[ai.chatMessages.length - 1]?.role !== 'assistant' && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground">
                        <span className="animate-pulse">🐱 Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Quick action chips */}
              <div className="px-4 py-2 flex gap-1.5 flex-wrap border-t border-border">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.prompt}
                    onClick={() => {
                      setChatInput('');
                      ai.sendChatMessage(qp.prompt);
                    }}
                    disabled={ai.isChatLoading}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              <div className="p-4 pt-2 border-t border-border flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask Whiskers anything..."
                  disabled={ai.isChatLoading}
                  className="flex-1"
                />
                <Button onClick={handleSendChat} disabled={ai.isChatLoading || !chatInput.trim()} size="sm">
                  Send
                </Button>
              </div>
            </TabsContent>

            {/* Names Tab */}
            <TabsContent value="names" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="p-4 space-y-3">
                <CatSelector cats={cats} value={selectedCatId} onChange={setSelectedCatId} />
                <Button
                  onClick={() => selectedCat && ai.generateNames(selectedCat)}
                  disabled={!selectedCat || ai.isNamesLoading}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                >
                  {ai.isNamesLoading ? '✨ Generating...' : '✨ Generate AI Names'}
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4 pb-4">
                {ai.nameSuggestions.length > 0 && (
                  <div className="grid gap-2">
                    {ai.nameSuggestions.map((s, i) => (
                      <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.meaning}</p>
                          </div>
                          {onRenameCat && selectedCat && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                onRenameCat(selectedCat.id, s.name);
                                setOpen(false);
                              }}
                            >
                              Apply
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {!ai.isNamesLoading && ai.nameSuggestions.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Select a cat and click generate to get AI name suggestions!
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Stories Tab */}
            <TabsContent value="stories" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="p-4 space-y-3">
                <CatSelector cats={cats} value={selectedCatId} onChange={setSelectedCatId} />
                <Button
                  onClick={() => selectedCat && ai.generateStory(selectedCat)}
                  disabled={!selectedCat || ai.isStoryLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {ai.isStoryLoading ? '📖 Writing...' : '📖 Generate Backstory'}
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4 pb-4">
                {ai.generatedStory && (
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                          <span>📖</span> {selectedCat?.name}'s Story
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {ai.generatedStory}
                        </p>
                      </CardContent>
                    </Card>
                    {onSaveBackstory && selectedCat && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          onSaveBackstory(selectedCat.id, ai.generatedStory);
                        }}
                      >
                        💾 Save to Cat Profile
                      </Button>
                    )}
                  </div>
                )}
                {!ai.isStoryLoading && !ai.generatedStory && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Select a cat to generate their unique backstory!
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="p-4">
                <Button
                  onClick={() => ai.generateTips(state)}
                  disabled={ai.isTipsLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  {ai.isTipsLoading ? '💡 Analyzing...' : '💡 Analyze My Farm'}
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4 pb-4">
                {ai.tips.length > 0 && (
                  <div className="space-y-3">
                    {ai.tips.map((tip, i) => {
                      const cfg = priorityConfig[tip.priority];
                      return (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <span className="text-lg mt-0.5">{cfg.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm">{tip.title}</h4>
                                  <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                                    {tip.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{tip.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                {!ai.isTipsLoading && ai.tips.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Click "Analyze My Farm" to get personalized strategy tips!
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CatSelector({
  cats,
  value,
  onChange,
}: {
  cats: Cat[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a cat..." />
      </SelectTrigger>
      <SelectContent>
        {cats.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.name} — {cat.breed} ({cat.personality})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
