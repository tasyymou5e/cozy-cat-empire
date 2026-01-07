import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Users, Gift, Clock, Check, X, Send, Trophy, Sparkles } from 'lucide-react';
import {
  ActiveCoopChallenge,
  CoopChallengeInvite,
  CoopChallenge,
  getCombinedProgress,
  isCoopChallengeCompleted,
  getContributionPercent,
} from '@/types/coopChallenges';
import { Friend } from '@/hooks/useFriends';
import { formatDistanceToNow } from 'date-fns';

interface CoopChallengesPanelProps {
  userId: string | undefined;
  friends: Friend[];
  activeChallenges: ActiveCoopChallenge[];
  pendingInvites: CoopChallengeInvite[];
  sentInvites: CoopChallengeInvite[];
  templates: CoopChallenge[];
  onSendInvite: (friendId: string, challengeId: string) => boolean | Promise<boolean>;
  onAcceptInvite: (inviteId: string) => boolean | Promise<boolean>;
  onDeclineInvite: (inviteId: string) => boolean | Promise<boolean>;
  onCancelInvite: (inviteId: string) => boolean | Promise<boolean>;
  onClaimReward: (
    challengeId: string
  ) => { coins: number; bonus: number } | null | Promise<{ coins: number; bonus: number } | null>;
}

export function CoopChallengesPanel({
  userId,
  friends,
  activeChallenges,
  pendingInvites,
  sentInvites,
  templates,
  onSendInvite,
  onAcceptInvite,
  onDeclineInvite,
  onCancelInvite,
  onClaimReward,
}: CoopChallengesPanelProps) {
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  if (!userId) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Coop Challenges
          </CardTitle>
          <CardDescription>Log in to start cooperative challenges with friends</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const activeChallengesList = activeChallenges.filter((c) => c.status === 'active');
  const completedChallenges = activeChallenges.filter((c) => c.status === 'completed');

  const handleSendInvite = async () => {
    if (!selectedFriend || !selectedChallenge) return;
    const success = await onSendInvite(selectedFriend, selectedChallenge);
    if (success) {
      setInviteDialogOpen(false);
      setSelectedFriend('');
      setSelectedChallenge('');
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Coop Challenges
            </CardTitle>
            <CardDescription>Work together with friends for bonus rewards!</CardDescription>
          </div>

          {pendingInvites.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
              {pendingInvites.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active" className="text-xs">
              Active ({activeChallengesList.length})
            </TabsTrigger>
            <TabsTrigger value="invites" className="text-xs relative">
              Invites
              {pendingInvites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                  {pendingInvites.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="start" className="text-xs">
              Start New
            </TabsTrigger>
          </TabsList>

          {/* Active Challenges */}
          <TabsContent value="active" className="space-y-3">
            {activeChallengesList.length === 0 && completedChallenges.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No active coop challenges</p>
                <p className="text-xs text-muted-foreground mt-1">Start one with a friend!</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-3">
                  {/* Completed first */}
                  {completedChallenges.map((challenge) => (
                    <ActiveChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClaimReward={onClaimReward}
                    />
                  ))}

                  {/* Then active */}
                  {activeChallengesList.map((challenge) => (
                    <ActiveChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClaimReward={onClaimReward}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Invites */}
          <TabsContent value="invites" className="space-y-3">
            {pendingInvites.length === 0 && sentInvites.length === 0 ? (
              <div className="text-center py-6">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No pending invites</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-3">
                  {/* Received invites */}
                  {pendingInvites.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground">Received</p>
                      {pendingInvites.map((invite) => (
                        <InviteCard
                          key={invite.id}
                          invite={invite}
                          type="received"
                          onAccept={() => onAcceptInvite(invite.id)}
                          onDecline={() => onDeclineInvite(invite.id)}
                        />
                      ))}
                    </>
                  )}

                  {/* Sent invites */}
                  {sentInvites.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-xs font-medium text-muted-foreground">Sent</p>
                      {sentInvites.map((invite) => (
                        <InviteCard
                          key={invite.id}
                          invite={invite}
                          type="sent"
                          onCancel={() => onCancelInvite(invite.id)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Start New Challenge */}
          <TabsContent value="start" className="space-y-3">
            {acceptedFriends.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Add friends to start coop challenges
                </p>
              </div>
            ) : (
              <>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Send className="h-4 w-4" />
                      Invite Friend to Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Start Coop Challenge
                      </DialogTitle>
                      <DialogDescription>
                        Choose a friend and challenge to work on together
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Friend</label>
                        <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a friend" />
                          </SelectTrigger>
                          <SelectContent>
                            {acceptedFriends.map((friend) => (
                              <SelectItem key={friend.friend_id} value={friend.friend_id}>
                                <span className="flex items-center gap-2">
                                  <span>{friend.avatar_emoji}</span>
                                  <span>{friend.display_name || 'Friend'}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Challenge</label>
                        <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a challenge" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <span className="flex items-center gap-2">
                                  <span>{template.emoji}</span>
                                  <span>{template.name}</span>
                                  <Badge variant="outline" className="ml-auto text-[10px]">
                                    {template.bonusMultiplier}x bonus
                                  </Badge>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedChallenge && (
                        <ChallengePreview
                          challenge={templates.find((t) => t.id === selectedChallenge)!}
                        />
                      )}

                      <Button
                        onClick={handleSendInvite}
                        className="w-full"
                        disabled={!selectedFriend || !selectedChallenge}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Invite
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <ScrollArea className="h-[240px] pr-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Available Challenges
                    </p>
                    {templates.map((template) => (
                      <ChallengeTemplateCard key={template.id} challenge={template} />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Sub-components

function ActiveChallengeCard({
  challenge,
  onClaimReward,
}: {
  challenge: ActiveCoopChallenge;
  onClaimReward: (
    id: string
  ) => { coins: number; bonus: number } | null | Promise<{ coins: number; bonus: number } | null>;
}) {
  const combined = getCombinedProgress(challenge);
  const target = challenge.challenge.targetValue;
  const progress = Math.min((combined / target) * 100, 100);
  const isCompleted = isCoopChallengeCompleted(challenge);
  const myContribution = getContributionPercent(challenge.myProgress, combined || 1);
  const partnerContribution = getContributionPercent(challenge.partnerProgress, combined || 1);

  return (
    <div
      className={`p-3 rounded-lg border ${isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-card/50 border-border'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{challenge.challenge.emoji}</span>
          <div>
            <p className="font-medium text-sm">{challenge.challenge.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{challenge.partnerAvatar}</span>
              with {challenge.partnerName}
            </p>
          </div>
        </div>

        {isCompleted && !challenge.rewardClaimed ? (
          <Button size="sm" onClick={() => onClaimReward(challenge.id)} className="gap-1">
            <Gift className="h-3 w-3" />
            Claim
          </Button>
        ) : challenge.rewardClaimed ? (
          <Badge variant="outline" className="text-green-600 border-green-500/30">
            <Check className="h-3 w-3 mr-1" />
            Claimed
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(challenge.expiresAt), { addSuffix: false })}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {combined} / {target}
          </span>
          <span className="flex items-center gap-2">
            <span>You: {challenge.myProgress}</span>
            <span>•</span>
            <span>
              {challenge.partnerName}: {challenge.partnerProgress}
            </span>
          </span>
        </div>

        {/* Contribution bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
          <div className="bg-primary transition-all" style={{ width: `${myContribution}%` }} />
          <div
            className="bg-secondary transition-all"
            style={{ width: `${partnerContribution}%` }}
          />
        </div>
      </div>

      {isCompleted && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span className="text-amber-600 font-medium">
            Reward: {challenge.challenge.rewardCoins} coins +{' '}
            {Math.floor(
              challenge.challenge.rewardCoins * (challenge.challenge.bonusMultiplier - 1)
            )}{' '}
            coop bonus!
          </span>
        </div>
      )}
    </div>
  );
}

function InviteCard({
  invite,
  type,
  onAccept,
  onDecline,
  onCancel,
}: {
  invite: CoopChallengeInvite;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{invite.challenge.emoji}</span>
          <div>
            <p className="font-medium text-sm">{invite.challenge.name}</p>
            <p className="text-xs text-muted-foreground">
              {type === 'received' ? (
                <>
                  From {invite.senderAvatar} {invite.senderName}
                </>
              ) : (
                <>Waiting for response...</>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {type === 'received' ? (
            <>
              <Button size="sm" variant="ghost" onClick={onDecline} className="h-8 w-8 p-0">
                <X className="h-4 w-4 text-destructive" />
              </Button>
              <Button size="sm" onClick={onAccept} className="h-8 w-8 p-0">
                <Check className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChallengeTemplateCard({ challenge }: { challenge: CoopChallenge }) {
  return (
    <div className="p-2 rounded-lg border bg-card/30 flex items-center gap-3">
      <span className="text-xl">{challenge.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{challenge.name}</p>
        <p className="text-xs text-muted-foreground truncate">{challenge.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge
          variant="outline"
          className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30"
        >
          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
          {challenge.bonusMultiplier}x
        </Badge>
        <span className="text-[10px] text-muted-foreground">{challenge.rewardCoins} coins</span>
      </div>
    </div>
  );
}

function ChallengePreview({ challenge }: { challenge: CoopChallenge }) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{challenge.emoji}</span>
        <div>
          <p className="font-medium">{challenge.name}</p>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-card">
          <p className="text-muted-foreground">Goal</p>
          <p className="font-bold">{challenge.targetValue}</p>
        </div>
        <div className="p-2 rounded bg-card">
          <p className="text-muted-foreground">Duration</p>
          <p className="font-bold">{challenge.durationDays} days</p>
        </div>
        <div className="p-2 rounded bg-card">
          <p className="text-muted-foreground">Reward</p>
          <p className="font-bold text-amber-600">{challenge.rewardCoins} + bonus</p>
        </div>
      </div>
    </div>
  );
}
