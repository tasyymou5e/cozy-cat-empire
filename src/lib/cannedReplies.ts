/**
 * Canned reply templates for the admin inbox.
 *
 * `{player}` is replaced with the player's display name when inserted.
 * Keep entries short and friendly — they're starting points, not scripts.
 */
export interface CannedReply {
  id: string;
  label: string;
  body: string;
}

export const CANNED_REPLIES: CannedReply[] = [
  {
    id: 'welcome',
    label: 'Welcome new player',
    body: "Hi {player}! 👋 Welcome to Cozy Cat Empire! If you ever have questions about the game, just reply here and we'll help out. Have fun building your cat empire! 🐾",
  },
  {
    id: 'thanks-feedback',
    label: 'Thanks for feedback',
    body: "Thanks so much for the feedback, {player}! 💛 We've noted it down — ideas from players like you shape what we build next.",
  },
  {
    id: 'bug-received',
    label: 'Bug report received',
    body: "Thanks for reporting this, {player}! 🛠️ We've logged the issue and our team is looking into it. We'll message you here as soon as it's fixed.",
  },
  {
    id: 'bug-fixed',
    label: 'Bug fixed',
    body: "Good news, {player}! 🎉 The issue you reported has been fixed. Refresh the game and it should be working — let us know if anything still seems off!",
  },
  {
    id: 'save-issue',
    label: 'Save / progress help',
    body: "Sorry to hear about the save trouble, {player}. 😿 Try opening the game and clicking the save indicator in the header to force a cloud sync. If your progress still looks wrong, reply here and we'll restore it for you from a backup.",
  },
  {
    id: 'trade-warning',
    label: 'Trade / conduct warning',
    body: "Hi {player}, we've noticed some activity on your account that goes against our community guidelines. Please keep trades and messages friendly — continued issues may lead to a suspension. Thanks for understanding. 💛",
  },
  {
    id: 'compensation',
    label: 'Compensation sent',
    body: "Hi {player}! 🎁 We've added a little something to your account to make up for the trouble. Thanks for your patience — enjoy!",
  },
  {
    id: 'event-heads-up',
    label: 'Event heads-up',
    body: "Psst, {player}! ✨ Something special is coming to Cozy Cat Empire soon. Keep an eye on the announcements banner so you don't miss it!",
  },
  {
    id: 'generic-followup',
    label: 'Generic follow-up',
    body: "Just checking in, {player}! 😺 Did that resolve things for you? If you need anything else, reply here anytime.",
  },
];

/** Replace supported placeholders in a template body. */
export function renderCannedReply(body: string, playerName: string): string {
  return body.replaceAll('{player}', playerName);
}
