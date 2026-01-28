
# Improve AdminModeration Gifts Table

## Problem Statement

The current gifts table in AdminModeration shows truncated UUIDs for sender/recipient IDs and lacks any cat information:

**Current Display:**
| Status | Sender | Recipient | Message | Date | Actions |
|--------|--------|-----------|---------|------|---------|
| Pending | `93dcd753...` | `33a264c2...` | "Here you go!" | Jan 3, 02:57 | Revoke |

This makes it difficult for admins to understand who is gifting what to whom.

---

## Proposed Solution

Enhance the gifts table to display:
1. **Sender/Recipient display names** (with email fallback)
2. **Cat details** from the `cat_data` JSON (name, breed, grade)
3. **Cat avatar** using breed emoji

**Enhanced Display:**
| Status | Sender | Recipient | Cat | Message | Date | Actions |
|--------|--------|-----------|-----|---------|------|---------|
| Pending | 😺 CatLover99 (user@email.com) | 🐱 FarmKing (king@email.com) | 🐱 Oscar (Maine Coon, Grade 15) | "Here you go!" | Jan 3, 02:57 | Revoke |

---

## Implementation Approach

### Pattern Reference
Follow the same enrichment pattern used in `ActivityFeed.tsx`:
1. Fetch gifts data
2. Extract unique user IDs (sender_id + recipient_id)
3. Batch fetch profiles for all IDs
4. Map profiles to gifts in memory

### File Changes

#### `src/pages/admin/AdminModeration.tsx`

**1. Add new interfaces for enriched data:**
```typescript
interface GiftProfile {
  display_name: string | null;
  avatar_emoji: string | null;
  email: string | null;
}

interface EnrichedGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: {
    name?: string;
    breed?: string;
    grade?: number;
    value?: number;
  };
  message: string | null;
  status: string;
  created_at: string;
  sender_profile?: GiftProfile | null;
  recipient_profile?: GiftProfile | null;
}
```

**2. Update the gifts query (lines 74-85):**
```typescript
const { data: gifts, isLoading: giftsLoading } = useQuery({
  queryKey: ['admin-gifts'],
  queryFn: async () => {
    // Fetch gifts
    const { data: giftData, error } = await supabase
      .from('cat_gifts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!giftData || giftData.length === 0) return [];

    // Collect unique user IDs (senders + recipients)
    const userIds = [
      ...new Set([
        ...giftData.map(g => g.sender_id),
        ...giftData.map(g => g.recipient_id),
      ]),
    ];

    // Batch fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_emoji, email')
      .in('id', userIds);

    // Create profile lookup map
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, {
        display_name: p.display_name,
        avatar_emoji: p.avatar_emoji,
        email: p.email,
      }])
    );

    // Enrich gifts with profile data
    return giftData.map(gift => ({
      ...gift,
      sender_profile: profileMap.get(gift.sender_id) || null,
      recipient_profile: profileMap.get(gift.recipient_id) || null,
    })) as EnrichedGift[];
  },
});
```

**3. Add helper function for breed emoji:**
```typescript
const getBreedEmoji = (breed?: string): string => {
  const breedEmojis: Record<string, string> = {
    'stray': '🐱',
    'tabby': '🐈',
    'persian': '😸',
    'siamese': '😼',
    'maine-coon': '🦁',
    'british-shorthair': '🐱',
    'ragdoll': '😻',
    'bengal': '🐆',
  };
  return breedEmojis[breed || ''] || '🐱';
};
```

**4. Update table headers (line 405-412):**
Add a new "Cat" column between "Recipient" and "Message":
```tsx
<TableHead>Status</TableHead>
<TableHead>Sender</TableHead>
<TableHead>Recipient</TableHead>
<TableHead>Cat</TableHead>  {/* NEW */}
<TableHead>Message</TableHead>
<TableHead>Date</TableHead>
<TableHead>Actions</TableHead>
```

**5. Update table cells (lines 433-462):**

Replace truncated IDs with enriched profile display:

```tsx
{/* Sender */}
<TableCell>
  <div className="flex items-center gap-1.5">
    <span>{gift.sender_profile?.avatar_emoji || '👤'}</span>
    <div className="flex flex-col">
      <span className="text-sm font-medium truncate max-w-[120px]">
        {gift.sender_profile?.display_name || 'Unknown'}
      </span>
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
        {gift.sender_profile?.email || gift.sender_id.slice(0, 8) + '...'}
      </span>
    </div>
  </div>
</TableCell>

{/* Recipient */}
<TableCell>
  <div className="flex items-center gap-1.5">
    <span>{gift.recipient_profile?.avatar_emoji || '👤'}</span>
    <div className="flex flex-col">
      <span className="text-sm font-medium truncate max-w-[120px]">
        {gift.recipient_profile?.display_name || 'Unknown'}
      </span>
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
        {gift.recipient_profile?.email || gift.recipient_id.slice(0, 8) + '...'}
      </span>
    </div>
  </div>
</TableCell>

{/* Cat Details - NEW */}
<TableCell>
  {(() => {
    const catData = gift.cat_data as EnrichedGift['cat_data'] | null;
    if (!catData) return '-';
    return (
      <div className="flex items-center gap-1.5">
        <span>{getBreedEmoji(catData.breed)}</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate max-w-[100px]">
            {catData.name || 'Unknown Cat'}
          </span>
          <span className="text-xs text-muted-foreground">
            {catData.breed?.replace('-', ' ') || 'Unknown'} · Grade {catData.grade ?? '?'}
          </span>
        </div>
      </div>
    );
  })()}
</TableCell>
```

**6. Update skeleton and empty state column counts:**
- Line 418: Change `Array.from({ length: 6 })` to `Array.from({ length: 7 })`
- Line 428: Change `colSpan={6}` to `colSpan={7}`

---

## Visual Comparison

### Before
```
| Pending | 93dcd753... | 33a264c2... | Here you go! | Jan 3 | [Revoke] |
```

### After
```
| Pending | 😺 CatLover99       | 🐱 FarmKing         | 🐱 Oscar              | Here you go! | Jan 3 | [Revoke] |
|         | user@email.com     | king@email.com     | Maine Coon · Grade 15 |              |       |          |
```

---

## Technical Notes

1. **No Database Changes Required** - Uses existing `profiles` table and `cat_data` JSON field
2. **Batch Fetching** - Single profile query for all users, not N+1 queries
3. **Graceful Fallbacks** - Shows truncated ID if profile lookup fails
4. **Type Safety** - New interfaces ensure proper typing of enriched data
5. **Consistent Pattern** - Matches the approach used in `ActivityFeed.tsx`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminModeration.tsx` | Add interfaces, update query, enhance table cells |

---

## Testing Considerations

1. Verify gifts with missing profiles show fallback (truncated ID)
2. Verify cat_data with missing fields displays gracefully
3. Check responsive behavior with long display names
4. Confirm loading skeleton matches new column count
