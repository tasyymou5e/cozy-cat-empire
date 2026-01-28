# Cat Data Sync & Recovery System

## Overview

This document describes the cat data synchronization system, snapshot-based recovery, and integrity monitoring.

## Data Flow

```
Browser localStorage → useCloudSave → game_saves table → Empire rendering
                    ↓
              save_snapshots (for recovery)
```

## Save Snapshots

Every cloud save creates a snapshot in `save_snapshots` table containing:
- `cat_count` - Number of cats at save time
- `cat_names` - Array of cat names for searching
- `day` - Game day at save time
- `money` - Money at save time
- `game_state_hash` - Quick comparison hash

**Retention:** Last 10 snapshots per user are kept.

## Sync Health Check

A cron job runs every 10 minutes to validate data integrity:

### Checks Performed
1. **Cat array validation** - Cats array exists and is valid
2. **Capacity check** - Cat count vs space limit
3. **Zero cats detection** - 0 cats after day 1 = critical
4. **Duplicate IDs** - No duplicate cat IDs
5. **Field validation** - Required fields present
6. **Value ranges** - Health 0-100, grade 1-20
7. **Money validation** - No negative values

### Issue Severities
- **Critical** - Data loss indicators (0 cats, invalid state)
- **Warning** - Data anomalies (over capacity, duplicates)
- **Info** - Minor issues (grade out of range)

## Recovery Tools

### Admin Save Recovery Page (`/catking/save-recovery`)

1. Search by user ID and cat names
2. View snapshot history
3. See related errors
4. Check portrait bucket for evidence
5. Get automated recommendations

### Edge Functions

- `recover-lost-cats` - Search for lost cat evidence
- `sync-health-check` - Periodic integrity validation

## Troubleshooting

### Cats Missing from Empire Page

1. Check if cats exist in `game_saves.game_state.cats`
2. Check if `portraitUrl` is set (fallback to SVG if not)
3. Review `save_snapshots` for when cats disappeared
4. Check `error_logs` for save failures

### Data Loss Prevention

The system prevents saves when:
- Cloud data hasn't loaded yet
- Empty cats array on day > 1
- Day 1 empty state without `isNewUser` flag

## Database Tables

### save_snapshots
```sql
CREATE TABLE save_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL,
  cat_count INTEGER NOT NULL,
  cat_names TEXT[] NOT NULL,
  day INTEGER NOT NULL,
  money INTEGER NOT NULL,
  game_state_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ
);
```

### sync_health_log
```sql
CREATE TABLE sync_health_log (
  id UUID PRIMARY KEY,
  run_at TIMESTAMPTZ NOT NULL,
  saves_checked INTEGER NOT NULL,
  saves_with_issues INTEGER NOT NULL,
  total_issues INTEGER NOT NULL,
  issue_summary JSONB,
  execution_time_ms INTEGER
);
```
