# Hook Guidelines

This document provides guidelines for maintaining hooks in the Cat Farm codebase.

## Directory Structure

```
hooks/
├── game/              # Core game logic hooks
├── relationships/     # Decomposed relationship hooks
├── admin/             # Admin dashboard hooks
├── handlers/          # Event handler hooks
└── *.ts              # Feature-specific hooks
```

## Hook Dependency Guidelines

### Safe Empty Dependencies

These patterns are intentionally stable and can have empty dependency arrays:

#### 1. State Setters Only
Functions that only use React state setters (`setState`) can have empty deps since setters are stable.

```typescript
// ✅ Safe - only uses setters
const updateRelationship = useCallback((catId1, catId2, change) => {
  setRelationships((prev) => /* transform prev */);
}, []); // Empty deps OK
```

#### 2. Pure Functions with Parameters
Functions receiving all needed state as parameters don't need closure dependencies.

```typescript
// ✅ Safe - state passed as parameter
const socializeCats = useCallback((cat1: Cat, cat2: Cat, day: number) => {
  // Uses cat1, cat2, day directly - not from closure
  return processInteraction(cat1, cat2, day);
}, [processInteraction]); // Only callback dep needed
```

#### 3. LocalStorage Operations
Functions only touching localStorage can be stable.

```typescript
// ✅ Safe - localStorage is global
const loadLocalData = useCallback(() => {
  return JSON.parse(localStorage.getItem('key') || '{}');
}, []); // Empty deps OK
```

### Required Dependencies

Always include these in dependency arrays:

```typescript
// ❌ Missing dependency - will cause stale closures
const handleClick = useCallback(() => {
  console.log(someState); // someState read from closure!
}, []); // Bug!

// ✅ Correct
const handleClick = useCallback(() => {
  console.log(someState);
}, [someState]);
```

### Callback Dependencies

When a callback uses another callback:

```typescript
const addEvent = useCallback((cat1, cat2, data) => {
  updateRelationship(cat1.id, cat2.id, data.score);
}, [updateRelationship]); // Include callback dependency
```

## Decomposition Guidelines

### When to Split a Hook

Split hooks when they exceed ~200 lines OR have distinct responsibilities:

| Size | Action |
|------|--------|
| <100 lines | Keep as single hook |
| 100-200 lines | Consider splitting if multiple concerns |
| 200-400 lines | Split into 2-3 focused hooks |
| 400+ lines | Mandatory decomposition |

### How to Decompose

1. **Identify Concerns**: Group related state and functions
2. **Create Sub-Hooks**: One hook per concern
3. **Compose**: Create a main hook that combines sub-hooks
4. **Re-export**: Maintain backward compatibility via barrel exports

Example structure:
```
hooks/relationships/
├── index.ts                    # Barrel exports
├── useRelationships.ts         # Composed main hook
├── useRelationshipCore.ts      # State + CRUD
├── useRelationshipEvents.ts    # Event handling
├── useRelationshipDecay.ts     # Decay logic
└── useRelationshipGroups.ts    # Group detection
```

## Testing Guidelines

### Priority Order

1. **Security-critical hooks** (auth, permissions, rate limiting)
2. **Data mutation hooks** (CRUD operations)
3. **Business logic hooks** (game mechanics)
4. **UI state hooks** (lowest priority)

### Test File Location

```
hooks/
├── useMyHook.ts
└── __tests__/
    └── useMyHook.test.ts
```

### Mocking Patterns

```typescript
// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn() })),
    rpc: vi.fn(),
  },
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user' } })),
}));
```

## Performance Considerations

### Memoization

Use `useMemo` for expensive computations:

```typescript
const sortedCats = useMemo(
  () => cats.sort((a, b) => b.grade - a.grade),
  [cats]
);
```

### Avoiding Re-renders

Return stable references when possible:

```typescript
// ❌ Creates new object every render
return { data: someData };

// ✅ Memoize return value
return useMemo(() => ({ data: someData }), [someData]);
```

## Barrel Exports

Always export from `hooks/index.ts`:

```typescript
// hooks/index.ts
export { useRelationships } from './relationships';
export type { RelationshipSaveData } from './relationships';
```
