

# Cat Recovery Plan for eric@wccgroup.net

## Problem Summary

The user eric@wccgroup.net previously had cats (Chester, Mittens, Felix, Milo, Smokey) with AI-generated portraits that displayed correctly on the Empire page. These cats are **no longer in the current game save**.

### Evidence Found

**Gallery Photos Exist** (in `gallery_photos` table):
- Chester (cat_id: `ord7m1353`)
- Mittens (cat_id: `rcrgiuidz`)
- Felix (cat_id: `qr6t7fo10`)
- Milo (cat_id: `gesrg5mbg`)
- Smokey (cat_id: `g7695i4hn`)

**AI Portraits Were Generated** (in `ai_usage_log`):
| Cat | Portrait URL |
|-----|--------------|
| Chester | `.../cat-portraits/ord7m1353-1767621961164.png` |
| Mittens | `.../cat-portraits/rcrgiuidz-1767582001086.png` |
| Felix | `.../cat-portraits/qr6t7fo10-1767636936896.png` |
| Milo | `.../cat-portraits/gesrg5mbg-1767559271636.png` |
| Smokey | `.../cat-portraits/g7695i4hn-1767636986614.png` |

**Current Game Save** (11 cats, Day 34, $3M):
- Contains: Pepper, Max, Whiskers, Cookie, Luna, Ginger, Dumbledore, Gandalf, Biscuit, Bella, Muffin
- Missing: Chester, Mittens, Felix, Milo, Smokey

### Root Cause
The game save was overwritten with different cat data. There are **no save snapshots** in the `save_snapshots` table for this user to restore from.

---

## Recovery Plan

### Option A: Recreate Lost Cats with Original Portraits (Recommended)

Since the original cat IDs and portrait URLs are known from the AI usage log, we can recreate the cats and inject them back into the game save with their original portrait URLs.

**Cats to Recreate:**

```text
1. Chester (ord7m1353) - stray breed
   Portrait: https://bkkluziuyystiqkcpbnd.supabase.co/storage/v1/object/public/cat-portraits/ord7m1353-1767621961164.png

2. Mittens (rcrgiuidz) - stray breed
   Portrait: https://bkkluziuyystiqkcpbnd.supabase.co/storage/v1/object/public/cat-portraits/rcrgiuidz-1767582001086.png

3. Felix (qr6t7fo10) - bengal breed
   Portrait: https://bkkluziuyystiqkcpbnd.supabase.co/storage/v1/object/public/cat-portraits/qr6t7fo10-1767636936896.png

4. Milo (gesrg5mbg) - stray breed
   Portrait: https://bkkluziuyystiqkcpbnd.supabase.co/storage/v1/object/public/cat-portraits/gesrg5mbg-1767559271636.png

5. Smokey (g7695i4hn) - tabby breed
   Portrait: https://bkkluziuyystiqkcpbnd.supabase.co/storage/v1/object/public/cat-portraits/g7695i4hn-1767636986614.png
```

### Implementation Steps

1. **Read current game_state** from `game_saves`
2. **Create cat objects** for each missing cat with:
   - Original cat ID (critical for portrait URL matching)
   - Original breed from AI log metadata
   - Original name
   - Original portrait URL
   - Default stats (health: 100, happiness: 100, hunger: 100, grade: 1)
3. **Append cats** to the existing cats array
4. **Update space** to accommodate new cats (add 5)
5. **Save updated game_state** back to database

### Technical Implementation

**Files to Create/Modify:**

| File | Purpose |
|------|---------|
| `supabase/functions/recover-lost-cats/index.ts` | Edge function to safely recover cats (already exists) |

The existing `recover-lost-cats` edge function can be used for this purpose, or we can directly update the game_save via admin action.

**SQL to Execute (Admin-level):**
```sql
-- This will add the 5 missing cats back to the game save
-- with their original IDs and portrait URLs
```

### Option B: Manual Admin Intervention

Use the Admin Dashboard to:
1. Navigate to User Management
2. Find eric@wccgroup.net
3. Edit the game save directly
4. Add the 5 missing cats with their original IDs and portrait URLs

---

## Prevention Measures

To prevent this issue in the future, consider implementing:

1. **Save Snapshots**: Automatically capture `save_snapshots` on significant events (cat portraits generated, purchases made)

2. **Cat Orphan Detection**: When loading a game, check if `gallery_photos` reference cat IDs not in the current save and offer recovery

3. **Portrait URL Persistence Check**: On Empire page load, verify that cats with gallery photos have their `portraitUrl` field populated

---

## Summary

| Issue | Status |
|-------|--------|
| Gallery photos exist | ✅ Found (7 photos for these cats) |
| AI portraits exist in storage | ✅ Found (URLs verified) |
| Cats in game save | ❌ Missing - need recovery |
| Save snapshots available | ❌ None found |

**Recommended Action**: Inject the 5 missing cats back into the game save with their original IDs and portrait URLs using the admin recovery process.

