import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Send, Inbox, Check, X } from 'lucide-react';
import { useCatGifts } from '@/hooks/useCatGifts';
import { useFriends } from '@/hooks/useFriends';
import { Cat } from '@/types/game';
import { BREEDS } from '@/types/game';

interface CatGiftingPanelProps {
  userId: string | undefined;
  cats: Cat[];
  onGiftSent: (catId: string) => void;
  onGiftReceived: (cat: Cat) => void;
}

export function CatGiftingPanel({ userId, cats, onGiftSent, onGiftReceived }: CatGiftingPanelProps) {
  const { receivedGifts, sentGifts, loading, sendGift, acceptGift, declineGift } = useCatGifts(userId);
  const { friends } = useFriends(userId);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  const handleSendGift = async () => {
    if (!selectedCat || !selectedFriend) return;
    
    const cat = cats.find(c => c.id === selectedCat);
    if (!cat) return;

    setSending(true);
    const result = await sendGift(selectedFriend, cat, message);
    if (result.success) {
      onGiftSent(selectedCat);
      setSelectedCat('');
      setSelectedFriend('');
      setMessage('');
    }
    setSending(false);
  };

  const handleAcceptGift = async (giftId: string) => {
    const cat = await acceptGift(giftId);
    if (cat) {
      onGiftReceived(cat);
    }
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Log in to send and receive cat gifts!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-5 h-5" />
          Cat Gifting
          {receivedGifts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {receivedGifts.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="send">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send" className="text-xs">
              <Send className="w-3 h-3 mr-1" /> Send
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs">
              <Inbox className="w-3 h-3 mr-1" /> Received
              {receivedGifts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                  {receivedGifts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs">
              <Gift className="w-3 h-3 mr-1" /> Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-3 mt-3">
            {acceptedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add friends first to send gifts!
              </p>
            ) : cats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No cats to gift. Get more cats first!
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Cat</label>
                  <Select value={selectedCat} onValueChange={setSelectedCat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a cat to gift..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cats.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({BREEDS[cat.breed]?.name || cat.breed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Send To</label>
                  <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a friend..." />
                    </SelectTrigger>
                    <SelectContent>
                      {acceptedFriends.map(friend => (
                        <SelectItem key={friend.friend_id} value={friend.friend_id}>
                          {friend.display_name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  onClick={handleSendGift}
                  disabled={!selectedCat || !selectedFriend || sending}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Gift'}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-3">
            <ScrollArea className="h-[200px]">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : receivedGifts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending gifts
                </p>
              ) : (
                <div className="space-y-2">
                  {receivedGifts.map(gift => (
                    <div key={gift.id} className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{gift.cat_data.name}</p>
                          <p className="text-xs text-muted-foreground">
                            From: {gift.sender_name}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {BREEDS[gift.cat_data.breed]?.name || gift.cat_data.breed}
                        </Badge>
                      </div>
                      {gift.message && (
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          "{gift.message}"
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptGift(gift.id)}
                        >
                          <Check className="w-3 h-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => declineGift(gift.id)}
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

          <TabsContent value="sent" className="mt-3">
            <ScrollArea className="h-[200px]">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : sentGifts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sent gifts
                </p>
              ) : (
                <div className="space-y-2">
                  {sentGifts.map(gift => (
                    <div key={gift.id} className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{gift.cat_data.name}</p>
                          <p className="text-xs text-muted-foreground">
                            To: {gift.recipient_name}
                          </p>
                        </div>
                        <Badge variant={
                          gift.status === 'accepted' ? 'default' :
                          gift.status === 'declined' ? 'destructive' : 'secondary'
                        }>
                          {gift.status}
                        </Badge>
                      </div>
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
