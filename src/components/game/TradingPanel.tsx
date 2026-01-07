import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeftRight, Send, Inbox, Check, X, Package } from 'lucide-react';
import { useTrading } from '@/hooks/useTrading';
import { useFriends } from '@/hooks/useFriends';
import { Cat, Resources, BREEDS } from '@/types/game';
import { CatVisual } from './CatVisual';

/**
 * Props for the TradingPanel component
 */
interface TradingPanelProps {
  /** Current user's ID (undefined if not logged in) */
  userId: string | undefined;
  /** Array of cats available for trading */
  cats: Cat[];
  /** Current money available */
  money: number;
  /** Current resource amounts */
  resources: Resources;
  /** Callback when a trade is completed */
  onTradeComplete: (
    removeCats: string[],
    addCats: Cat[],
    moneyChange: number,
    resourceChanges: Partial<Resources>
  ) => void;
  /** Map of cat IDs to equipped costume IDs */
  catCostumes?: Record<string, string>;
}

/**
 * TradingPanel - Player-to-player trading interface
 *
 * Allows players to create, send, and manage trade offers with friends.
 * Supports trading cats and money. Shows incoming and outgoing trades.
 *
 * @example
 * ```tsx
 * <TradingPanel
 *   userId={user?.id}
 *   cats={cats}
 *   money={150}
 *   resources={resources}
 *   onTradeComplete={handleTradeComplete}
 * />
 * ```
 */

export function TradingPanel({
  userId,
  cats,
  money,
  resources,
  onTradeComplete,
  catCostumes,
}: TradingPanelProps) {
  const {
    incomingTrades,
    outgoingTrades,
    loading,
    createTrade,
    acceptTrade,
    declineTrade,
    cancelTrade,
  } = useTrading(userId);
  const { friends } = useFriends(userId);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [offerMoney, setOfferMoney] = useState<number>(0);
  const [requestMoney, setRequestMoney] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');

  const handleCatToggle = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleCreateTrade = async () => {
    if (!selectedFriend || (selectedCats.length === 0 && offerMoney === 0)) return;

    const offeredCats = cats.filter((c) => selectedCats.includes(c.id));

    setSending(true);
    const result = await createTrade({
      recipientId: selectedFriend,
      offeredCats,
      offeredMoney: offerMoney,
      offeredResources: {},
      requestedMoney: requestMoney,
      requestedResources: {},
      message,
    });

    if (result.success) {
      // Remove offered cats from game state
      onTradeComplete(selectedCats, [], -offerMoney, {});
      setSelectedCats([]);
      setSelectedFriend('');
      setOfferMoney(0);
      setRequestMoney(0);
      setMessage('');
    }
    setSending(false);
  };

  const handleAcceptTrade = async (tradeId: string) => {
    const trade = await acceptTrade(tradeId);
    if (trade) {
      // Add offered cats, remove requested money
      onTradeComplete([], trade.offered_cats, trade.offered_money - trade.requested_money, {});
    }
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Log in to trade with friends!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowLeftRight className="w-5 h-5" />
          Trading
          {incomingTrades.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {incomingTrades.length} offers
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="text-xs">
              <Send className="w-3 h-3 mr-1" /> Create
            </TabsTrigger>
            <TabsTrigger value="incoming" className="text-xs">
              <Inbox className="w-3 h-3 mr-1" /> Incoming
              {incomingTrades.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                  {incomingTrades.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="text-xs">
              <Package className="w-3 h-3 mr-1" /> Outgoing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-3 mt-3">
            {acceptedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add friends first to trade!
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trade With</label>
                  <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a friend..." />
                    </SelectTrigger>
                    <SelectContent>
                      {acceptedFriends.map((friend) => (
                        <SelectItem key={friend.friend_id} value={friend.friend_id}>
                          {friend.display_name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Offer</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-2 border rounded">
                    {cats.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedCats.includes(cat.id)}
                          onCheckedChange={() => handleCatToggle(cat.id)}
                        />
                        <CatVisual cat={cat} size="xs" equippedCostumeId={catCostumes?.[cat.id]} />
                        <span className="text-xs truncate">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Offer Money</label>
                    <Input
                      type="number"
                      min={0}
                      max={money}
                      value={offerMoney}
                      onChange={(e) =>
                        setOfferMoney(Math.min(money, parseInt(e.target.value) || 0))
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">Max: ${money}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Request Money</label>
                    <Input
                      type="number"
                      min={0}
                      value={requestMoney}
                      onChange={(e) => setRequestMoney(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message (optional)</label>
                  <Textarea
                    placeholder="Add a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateTrade}
                  disabled={
                    !selectedFriend || (selectedCats.length === 0 && offerMoney === 0) || sending
                  }
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Trade Offer'}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-3">
            <ScrollArea className="h-[250px]">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : incomingTrades.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No incoming trade offers
                </p>
              ) : (
                <div className="space-y-2">
                  {incomingTrades.map((trade) => (
                    <div key={trade.id} className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">From: {trade.sender_name}</p>
                        <Badge variant="secondary">pending</Badge>
                      </div>

                      <div className="text-xs space-y-1 mb-2">
                        <p className="font-medium">They offer:</p>
                        {trade.offered_cats.length > 0 && (
                          <p>🐱 {trade.offered_cats.map((c) => c.name).join(', ')}</p>
                        )}
                        {trade.offered_money > 0 && <p>💰 ${trade.offered_money}</p>}

                        {trade.requested_money > 0 && (
                          <>
                            <p className="font-medium mt-2">They want:</p>
                            <p>💰 ${trade.requested_money}</p>
                          </>
                        )}
                      </div>

                      {trade.message && (
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          "{trade.message}"
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptTrade(trade.id)}
                          disabled={trade.requested_money > money}
                        >
                          <Check className="w-3 h-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => declineTrade(trade.id)}
                        >
                          <X className="w-3 h-3 mr-1" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="outgoing" className="mt-3">
            <ScrollArea className="h-[250px]">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : outgoingTrades.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No outgoing trade offers
                </p>
              ) : (
                <div className="space-y-2">
                  {outgoingTrades.map((trade) => (
                    <div key={trade.id} className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">To: {trade.recipient_name}</p>
                        <Badge
                          variant={
                            trade.status === 'accepted'
                              ? 'default'
                              : trade.status === 'declined'
                                ? 'destructive'
                                : trade.status === 'cancelled'
                                  ? 'outline'
                                  : 'secondary'
                          }
                        >
                          {trade.status}
                        </Badge>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-medium">You offered:</p>
                        {trade.offered_cats.length > 0 && (
                          <p>🐱 {trade.offered_cats.map((c) => c.name).join(', ')}</p>
                        )}
                        {trade.offered_money > 0 && <p>💰 ${trade.offered_money}</p>}
                      </div>

                      {trade.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => cancelTrade(trade.id)}
                        >
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
