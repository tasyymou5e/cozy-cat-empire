
# Update CatGift Type to Include Admin Revocation Status

## Summary

The `CatGift` interface in `useCatGifts.ts` needs to include `'revoked_by_admin'` as a valid status value. This status is used by the admin moderation panel to revoke pending gifts, but is currently missing from the type definition.

---

## Changes Required

### File: `src/hooks/useCatGifts.ts`

**Update 1: JSDoc comment (line 25)**

Change from:
```typescript
 * @property {'pending' | 'accepted' | 'declined'} status - Gift status
```

To:
```typescript
 * @property {'pending' | 'accepted' | 'declined' | 'revoked_by_admin'} status - Gift status
```

**Update 2: Interface definition (line 36)**

Change from:
```typescript
status: 'pending' | 'accepted' | 'declined';
```

To:
```typescript
status: 'pending' | 'accepted' | 'declined' | 'revoked_by_admin';
```

**Update 3: Type assertions (lines 186, 195, 249)**

Update all three locations where the status is cast to include the new value:

```typescript
// Line 186
status: g.status as 'pending' | 'accepted' | 'declined' | 'revoked_by_admin',

// Line 195  
status: g.status as 'pending' | 'accepted' | 'declined' | 'revoked_by_admin',

// Line 249
status: newGift.status as 'pending' | 'accepted' | 'declined' | 'revoked_by_admin',
```

---

## Optional Improvement: Extract Status Type

To avoid repetition, we could extract the status union into a named type:

```typescript
/** Valid gift status values */
type CatGiftStatus = 'pending' | 'accepted' | 'declined' | 'revoked_by_admin';
```

Then use `CatGiftStatus` throughout the file. This makes future status additions easier.

---

## Files Summary

| File | Change |
|------|--------|
| `src/hooks/useCatGifts.ts` | Add `'revoked_by_admin'` to status type in 4 locations |

This is a straightforward type definition update with no behavioral changes.
