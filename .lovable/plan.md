

# Add AI Features to Cat Farm

This plan adds four AI-powered features using Lovable AI (via an edge function calling the gateway). All features share a single `cat-ai-assistant` edge function with different action types, keeping things simple and maintainable.

---

## Architecture

A single new edge function `cat-ai-assistant` handles all four AI use cases via an `action` parameter:

- `chat` -- General AI cat advisor chat
- `name` -- Generate creative cat names
- `story` -- Generate cat backstory/personality description
- `tips` -- Analyze game state and suggest strategy

The frontend gets a new floating AI button (bottom-right corner) that opens a drawer/panel with tabs for each feature.

---

## New Files

### 1. Edge Function: `supabase/functions/cat-ai-assistant/index.ts`

Handles all four AI actions. Uses `LOVABLE_API_KEY` (already configured) and the Lovable AI Gateway with `google/gemini-3-flash-preview`.

**Action: `chat`** -- Receives conversation history, returns streaming response. System prompt is a cat game expert persona.

**Action: `name`** -- Receives cat breed, personality, appearance. Returns 5-8 creative AI-generated names with meanings. Non-streaming, uses tool calling to return structured JSON.

**Action: `story`** -- Receives full cat data (breed, personality, appearance, grade, tricks, show wins). Returns a creative 2-3 paragraph backstory. Non-streaming.

**Action: `tips`** -- Receives game state summary (money, day, cat count, resources, house size, relationships summary). Returns 3-5 prioritized strategic tips. Non-streaming, structured output.

### 2. Component: `src/components/game/AICatAdvisor.tsx`

A floating button + drawer/dialog component containing:

- **Chat tab**: Streaming chat interface with markdown rendering. Messages stored in local state (no persistence needed). The AI persona is a wise old cat named "Whiskers" who gives game advice.
- **Name Generator tab**: Select a cat → click "Generate Names" → shows AI-generated names with meanings → click to apply name. Integrates with existing rename functionality.
- **Story Generator tab**: Select a cat → click "Generate Story" → displays a creative backstory. Option to save to cat's data (new optional `backstory` field).
- **Tips tab**: Click "Analyze My Farm" → sends game state summary → displays prioritized tips with icons.

### 3. Hook: `src/hooks/useAICatAdvisor.ts`

Manages state for:
- Chat messages and streaming
- Name generation requests
- Story generation requests  
- Tips generation requests
- Loading/error states for each

---

## Modified Files

### `supabase/config.toml`
Add the new function entry:
```toml
[functions.cat-ai-assistant]
verify_jwt = false
```

### `src/types/game.ts`
Add optional `backstory?: string` field to the `Cat` interface for AI-generated stories.

### `src/constants/tabs.ts`
Add AI tab:
```typescript
ai: { label: 'AI Advisor', icon: '🤖' }
```

### `src/components/game/CatFarm.tsx`
Add the AI Advisor floating button to both mobile and desktop layouts. It renders as a fixed-position sparkle button that opens a sheet/drawer.

### `src/components/game/panels/index.ts`
Export the new AI panel.

---

## Edge Function Design

```typescript
// cat-ai-assistant/index.ts (simplified structure)

// Action: "chat" - streaming conversation
// → System prompt: "You are Whiskers, a wise old cat advisor..."
// → Streams response back via SSE

// Action: "name" - structured name generation  
// → Prompt: "Generate 6 creative names for a {breed} cat with {personality} personality..."
// → Uses tool_choice to return structured { names: [{ name, meaning }] }

// Action: "story" - backstory generation
// → Prompt: "Write a 2-3 paragraph creative backstory for {cat details}..."
// → Returns { story: string }

// Action: "tips" - game strategy
// → Prompt: "Analyze this cat farm and give 3-5 tips: {game state}..."
// → Uses tool_choice to return structured { tips: [{ title, description, priority }] }
```

---

## UI Design

**Floating AI Button**: Fixed bottom-right, animated sparkle icon with a subtle glow pulse. Badge shows "AI" text.

**AI Panel (Sheet/Drawer)**:
- Header with Whiskers avatar (cat emoji) and "AI Cat Advisor" title
- 4 tabs: Chat | Names | Stories | Tips
- **Chat**: Message bubbles, input field, streaming text display
- **Names**: Cat selector dropdown → Generate button → Name cards with "Apply" buttons
- **Stories**: Cat selector → Generate button → Formatted story text with "Save" option
- **Tips**: "Analyze" button → Tip cards with priority badges (🔴 High, 🟡 Medium, 🟢 Low)

---

## Technical Notes

- All AI calls go through the edge function -- no direct client calls
- Chat uses SSE streaming for real-time token display
- Name and tips use tool calling for structured output
- Story uses simple text completion
- `LOVABLE_API_KEY` is already configured as a secret
- Rate limiting: handled by Lovable AI gateway; 429/402 errors surfaced as toasts
- No database changes needed (backstory stored in game state JSONB via existing cloud save)

