# Cat Farm - Architecture Diagrams

Visual documentation of the Cat Farm game architecture showing relationships between components, hooks, and database tables.

---

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        Pages[Pages]
        Components[Components]
        Hooks[Hooks]
        Contexts[Contexts]
    end
    
    subgraph Backend["Lovable Cloud"]
        Auth[Authentication]
        DB[(Database)]
        Storage[Storage Buckets]
        Edge[Edge Functions]
    end
    
    Pages --> Components
    Components --> Hooks
    Hooks --> Contexts
    Hooks --> DB
    Hooks --> Auth
    Hooks --> Storage
    Edge --> DB
    Edge --> Storage
```

---

## Component Hierarchy

```mermaid
graph TD
    App[App.tsx]
    App --> AuthProvider[AuthProvider]
    App --> ThemeProvider[ThemeProvider]
    App --> SoundProvider[SoundProvider]
    App --> QueryProvider[QueryClientProvider]
    App --> ErrorBoundary[ErrorBoundary]
    App --> Router[BrowserRouter]
    
    Router --> Index[Index.tsx]
    Router --> Auth[Auth.tsx]
    Router --> Collection[CatCollection.tsx]
    Router --> PhotoBooth[CatPhotoBooth.tsx]
    Router --> Gallery[CatGallery.tsx]
    Router --> Customization[CatCustomization.tsx]
    Router --> Leaderboard[Leaderboard.tsx]
    Router --> Stats[Stats.tsx]
    Router --> Admin[Admin Pages]
    
    Index --> CatFarm[CatFarm.tsx]
```

---

## Main Game Component Structure

```mermaid
graph TD
    CatFarm[CatFarm.tsx]
    
    CatFarm --> StatusBar[StatusBar]
    CatFarm --> MessageBar[MessageBar]
    CatFarm --> NotificationCenter[NotificationCenter]
    CatFarm --> AnnouncementBanner[AnnouncementBanner]
    
    subgraph Panels["Game Panels (16 tabs)"]
        ActionPanel[ActionPanel]
        ChorePanel[ChorePanel]
        ResourcePanel[ResourcePanel]
        MarketPanel[MarketPanel]
        CostumeShopPanel[CostumeShopPanel]
        BreedingPanel[BreedingPanel]
        TrainingPanel[TrainingPanel]
        CatShowPanel[CatShowPanel]
        SocializePanel[SocializePanel]
        RelationshipPanel[RelationshipPanel]
        LeaderboardPanel[LeaderboardPanel]
        AchievementsPanel[AchievementsPanel]
        FriendsPanel[FriendsPanel]
        TradingPanel[TradingPanel]
        BulkActionsPanel[BulkActionsPanel]
        SaveLoadPanel[SaveLoadPanel]
    end
    
    CatFarm --> Panels
    
    subgraph CatDisplay["Cat Display"]
        CatCard[CatCard]
        UnifiedCatCard[UnifiedCatCard]
        CatAvatar[CatAvatar]
        CatVisual[CatVisual]
        CatPortrait[CatPortrait]
    end
    
    Panels --> CatDisplay
```

---

## Hooks Architecture

```mermaid
graph LR
    subgraph CoreGame["Core Game Hooks"]
        useGameState[useGameState]
        useRelationships[useRelationships]
        useSoundEffects[useSoundEffects]
        useConfetti[useConfetti]
        useKeyboardShortcuts[useKeyboardShortcuts]
    end
    
    subgraph Cloud["Cloud & Persistence"]
        useCloudSave[useCloudSave]
        useCloudGallery[useCloudGallery]
        usePhotoGallery[usePhotoGallery]
        usePlayerProfile[usePlayerProfile]
        usePlayerStats[usePlayerStats]
    end
    
    subgraph Social["Social Features"]
        useFriends[useFriends]
        useCatGifts[useCatGifts]
        useTrading[useTrading]
        useNotifications[useNotifications]
        usePushNotifications[usePushNotifications]
    end
    
    subgraph Progress["Progress & Rewards"]
        useGlobalLeaderboard[useGlobalLeaderboard]
        useLeaderboardHistory[useLeaderboardHistory]
        useLeaderboardRewards[useLeaderboardRewards]
        useDailyLoginRewards[useDailyLoginRewards]
        useWeeklyChallenges[useWeeklyChallenges]
        useChallengeAchievements[useChallengeAchievements]
    end
    
    subgraph Admin["Admin Hooks"]
        useAdminAuth[useAdminAuth]
        useAdminData[useAdminData]
        useAdminActivityLog[useAdminActivityLog]
        useAdminAIData[useAdminAIData]
    end
    
    subgraph Utility["Utility Hooks"]
        useErrorLogger[useErrorLogger]
        useHaptics[useHaptics]
        useInfiniteScroll[useInfiniteScroll]
        usePlayerActivityLog[usePlayerActivityLog]
    end
```

---

## Database Schema Relationships

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1"
    PROFILES ||--o{ GAME_SAVES : "has"
    PROFILES ||--o{ PLAYER_STATS : "has"
    PROFILES ||--o{ DAILY_LOGIN_REWARDS : "has"
    PROFILES ||--o{ GALLERY_PHOTOS : "owns"
    
    PROFILES ||--o{ PLAYER_FRIENDS : "sender"
    PROFILES ||--o{ PLAYER_FRIENDS : "recipient"
    
    PROFILES ||--o{ CAT_GIFTS : "sender"
    PROFILES ||--o{ CAT_GIFTS : "recipient"
    
    PROFILES ||--o{ TRADE_OFFERS : "sender"
    PROFILES ||--o{ TRADE_OFFERS : "recipient"
    
    PROFILES ||--o{ USER_ROLES : "has"
    PROFILES ||--o{ PUSH_SUBSCRIPTIONS : "has"
    PROFILES ||--o{ ERROR_LOGS : "generates"
    PROFILES ||--o{ PLAYER_ACTIVITY_LOG : "generates"
    
    WEEKLY_CHALLENGES ||--o{ PLAYER_CHALLENGE_PROGRESS : "tracks"
    PROFILES ||--o{ PLAYER_CHALLENGE_PROGRESS : "has"
    PROFILES ||--o{ PLAYER_CHALLENGE_STATS : "has"
    
    PROFILES ||--o{ LEADERBOARD_REWARDS : "receives"
    PROFILES ||--o{ LEADERBOARD_SNAPSHOTS : "has"
    PROFILES ||--o{ RANK_HISTORY : "has"
    
    PROFILES ||--o{ ADMIN_ACTIVITY_LOG : "admin actions"
    PROFILES ||--o{ AI_USAGE_LOG : "ai usage"

    PROFILES {
        uuid id PK
        text email
        text display_name
        text avatar_emoji
        text username
        timestamp suspended_at
    }
    
    GAME_SAVES {
        uuid id PK
        uuid user_id FK
        jsonb game_state
        int kittens_bred
        jsonb relationships
    }
    
    PLAYER_STATS {
        uuid id PK
        uuid user_id FK
        int total_show_wins
        int total_cats_owned
        int total_kittens_bred
    }
    
    PLAYER_FRIENDS {
        uuid id PK
        uuid user_id FK
        uuid friend_id FK
        text status
    }
    
    CAT_GIFTS {
        uuid id PK
        uuid sender_id FK
        uuid recipient_id FK
        jsonb cat_data
        text status
    }
    
    TRADE_OFFERS {
        uuid id PK
        uuid sender_id FK
        uuid recipient_id FK
        jsonb offered_cats
        int offered_money
        text status
    }
```

---

## Data Flow: Game State

```mermaid
sequenceDiagram
    participant User
    participant CatFarm
    participant useGameState
    participant useCloudSave
    participant Database
    
    User->>CatFarm: Opens Game
    CatFarm->>useGameState: Initialize
    useGameState->>useGameState: Load from localStorage
    
    alt User is authenticated
        CatFarm->>useCloudSave: Check cloud save
        useCloudSave->>Database: Fetch game_saves
        Database-->>useCloudSave: Return save data
        useCloudSave-->>CatFarm: Merge with local
    end
    
    User->>CatFarm: Performs action
    CatFarm->>useGameState: Update state
    useGameState->>useGameState: Save to localStorage
    
    loop Every 5 minutes
        useCloudSave->>Database: Auto-save
    end
```

---

## Data Flow: Social Features

```mermaid
sequenceDiagram
    participant Sender
    participant TradingPanel
    participant useTrading
    participant Database
    participant Realtime
    participant Recipient
    
    Sender->>TradingPanel: Create trade offer
    TradingPanel->>useTrading: createTrade()
    useTrading->>Database: INSERT trade_offers
    Database-->>Realtime: Trigger notification
    Realtime-->>Recipient: Push notification
    
    Recipient->>TradingPanel: View trade
    Recipient->>useTrading: acceptTrade()
    useTrading->>Database: UPDATE status='accepted'
    useTrading->>useTrading: Transfer cats & money
    Database-->>Realtime: Trigger notification
    Realtime-->>Sender: Trade accepted
```

---

## Authentication Flow

```mermaid
flowchart TD
    Start([User Visits App])
    Start --> CheckAuth{Authenticated?}
    
    CheckAuth -->|No| AuthPage[Auth Page]
    AuthPage --> LoginForm[Login Form]
    AuthPage --> SignupForm[Signup Form]
    
    LoginForm --> AttemptLogin[Attempt Login]
    SignupForm --> AttemptSignup[Attempt Signup]
    
    AttemptLogin --> LogAttempt[Log to auth_attempts_log]
    AttemptSignup --> LogAttempt
    
    LogAttempt --> AuthResult{Success?}
    
    AuthResult -->|No| ShowError[Show Error]
    ShowError --> AuthPage
    
    AuthResult -->|Yes| CreateProfile[Create/Update Profile]
    CreateProfile --> CheckAdmin{Is Admin?}
    
    CheckAdmin -->|Yes| AdminDashboard[Admin Dashboard]
    CheckAdmin -->|No| GamePage[Game Page]
    
    CheckAuth -->|Yes| CheckSuspended{Suspended?}
    CheckSuspended -->|Yes| SuspendedPage[Suspended Notice]
    CheckSuspended -->|No| GamePage
```

---

## Admin System Architecture

```mermaid
graph TB
    subgraph AdminPages["Admin Pages"]
        AdminDashboard[AdminDashboard]
        AdminUsers[AdminUsers]
        AdminStatistics[AdminStatistics]
        AdminErrorLogs[AdminErrorLogs]
        AdminModeration[AdminModeration]
        AdminAnnouncements[AdminAnnouncements]
        AdminAIMetrics[AdminAIMetrics]
        AdminSettings[AdminSettings]
    end
    
    subgraph AdminHooks["Admin Hooks"]
        useAdminAuth
        useAdminData
        useAdminActivityLog
        useAdminAIData
    end
    
    subgraph AdminComponents["Admin Components"]
        AdminLayout[AdminLayout]
        AdminRoute[AdminRoute]
        UserDetailModal[UserDetailModal]
        ActivityFeed[ActivityFeed]
        BulkActionsBar[BulkActionsBar]
    end
    
    subgraph AdminTables["Admin Tables"]
        user_roles[(user_roles)]
        admin_activity_log[(admin_activity_log)]
        auth_attempts_log[(auth_attempts_log)]
        error_logs[(error_logs)]
        ai_usage_log[(ai_usage_log)]
    end
    
    AdminPages --> AdminHooks
    AdminPages --> AdminComponents
    AdminHooks --> AdminTables
```

---

## Edge Functions

```mermaid
graph LR
    subgraph EdgeFunctions["Edge Functions"]
        GeneratePortrait[generate-cat-portrait]
        GenerateChallenges[generate-weekly-challenges]
        ProcessRewards[process-leaderboard-rewards]
        SendPush[send-push-notification]
        PasswordReset[send-password-reset]
        DeleteUser[admin-delete-user]
    end
    
    subgraph ExternalAPIs["External Services"]
        AI[AI Models]
        Email[Email Service]
        Push[Push Service]
    end
    
    subgraph Database["Database"]
        ai_usage_log[(ai_usage_log)]
        weekly_challenges[(weekly_challenges)]
        leaderboard_rewards[(leaderboard_rewards)]
        push_subscriptions[(push_subscriptions)]
        profiles[(profiles)]
    end
    
    GeneratePortrait --> AI
    GeneratePortrait --> ai_usage_log
    
    GenerateChallenges --> AI
    GenerateChallenges --> weekly_challenges
    
    ProcessRewards --> leaderboard_rewards
    
    SendPush --> Push
    SendPush --> push_subscriptions
    
    PasswordReset --> Email
    
    DeleteUser --> profiles
```

---

## Storage Architecture

```mermaid
graph TD
    subgraph StorageBuckets["Storage Buckets"]
        PhotoGallery[photo-gallery]
        CatPortraits[cat-portraits]
    end
    
    subgraph Components["Components"]
        PhotoBooth[PhotoBooth]
        GalleryPhotoCard[GalleryPhotoCard]
        CatPortrait[CatPortrait]
        BatchPortraitGenerator[BatchPortraitGenerator]
    end
    
    subgraph Hooks["Hooks"]
        usePhotoGallery
        useCloudGallery
    end
    
    PhotoBooth --> useCloudGallery
    useCloudGallery --> PhotoGallery
    
    GalleryPhotoCard --> usePhotoGallery
    usePhotoGallery --> PhotoGallery
    
    CatPortrait --> CatPortraits
    BatchPortraitGenerator --> CatPortraits
```

---

## Real-time Features

```mermaid
graph TD
    subgraph RealtimeChannels["Realtime Channels"]
        FriendRequests[Friend Requests]
        CatGifts[Cat Gifts]
        TradeOffers[Trade Offers]
        Announcements[Announcements]
    end
    
    subgraph Hooks["Listening Hooks"]
        useNotifications
        useFriends
        useCatGifts
        useTrading
    end
    
    subgraph UI["UI Components"]
        NotificationCenter
        FriendsPanel
        CatGiftingPanel
        TradingPanel
        GiftReceivedDialog
        TradeReceivedDialog
    end
    
    FriendRequests --> useNotifications
    CatGifts --> useCatGifts
    TradeOffers --> useTrading
    Announcements --> useNotifications
    
    useNotifications --> NotificationCenter
    useFriends --> FriendsPanel
    useCatGifts --> CatGiftingPanel
    useCatGifts --> GiftReceivedDialog
    useTrading --> TradingPanel
    useTrading --> TradeReceivedDialog
```

---

## Cat Data Model

```mermaid
classDiagram
    class Cat {
        +string id
        +string type
        +CatBreed breed
        +string name
        +number health
        +number happiness
        +number hunger
        +number value
        +number age
        +CatPersonality personality
        +number showWins
        +boolean isForSale
        +number grade
        +TrickId[] tricksLearned
        +Record trickProgress
        +number restLevel
        +number feedingScore
        +number lastTrainingDay
        +CatAppearance appearance
        +string portraitUrl
    }
    
    class CatAppearance {
        +FurColor furColor
        +FurPattern pattern
        +string patternColor
        +EyeColor eyeColor
        +HairLength hairLength
        +FacialFeature[] facialFeatures
    }
    
    class CatRelationship {
        +string cat1Id
        +string cat2Id
        +number score
        +RelationshipEvent[] history
    }
    
    class GameState {
        +Cat[] cats
        +number money
        +number space
        +HouseSize houseSize
        +number acres
        +number day
        +Resources resources
        +Achievement[] achievements
        +string[] ownedCostumes
        +Record catCostumes
    }
    
    Cat --> CatAppearance
    GameState --> Cat
    CatRelationship --> Cat
```

---

## VIP & Rewards System

```mermaid
flowchart TD
    Login([Daily Login])
    Login --> CheckStreak{Check Streak}
    
    CheckStreak --> UpdateStreak[Update Streak Counter]
    UpdateStreak --> CalculateVIP[Calculate VIP Tier]
    
    CalculateVIP --> Bronze{7+ days}
    CalculateVIP --> Silver{14+ days}
    CalculateVIP --> Gold{30+ days}
    CalculateVIP --> Platinum{60+ days}
    CalculateVIP --> Diamond{90+ days}
    
    Bronze --> Multiplier1[1.1x Rewards]
    Silver --> Multiplier2[1.25x Rewards]
    Gold --> Multiplier3[1.5x Rewards]
    Platinum --> Multiplier4[2x Rewards]
    Diamond --> Multiplier5[3x Rewards]
    
    subgraph DailyRewards["Daily Rewards"]
        Day1[Day 1: 50 coins]
        Day2[Day 2: 75 coins]
        Day3[Day 3: 100 coins]
        Day4[Day 4: 150 coins]
        Day5[Day 5: 200 coins]
        Day6[Day 6: 300 coins]
        Day7[Day 7: 500 coins + Rare Cat]
    end
```

---

## Weekly Challenges Flow

```mermaid
flowchart LR
    subgraph Generation["Challenge Generation"]
        EdgeFunction[Edge Function]
        AIModel[AI Model]
        EdgeFunction --> AIModel
        AIModel --> WeeklyChallenges[(weekly_challenges)]
    end
    
    subgraph Tracking["Progress Tracking"]
        GameActions[Game Actions]
        useWeeklyChallenges[useWeeklyChallenges]
        PlayerProgress[(player_challenge_progress)]
        
        GameActions --> useWeeklyChallenges
        useWeeklyChallenges --> PlayerProgress
    end
    
    subgraph Rewards["Reward Distribution"]
        Completion{Completed?}
        ClaimReward[Claim Reward]
        UpdateStats[(player_challenge_stats)]
        
        PlayerProgress --> Completion
        Completion -->|Yes| ClaimReward
        ClaimReward --> UpdateStats
    end
```

---

## File Structure Overview

```
src/
├── components/
│   ├── game/          # 45+ game components
│   ├── admin/         # 6 admin components
│   ├── stats/         # 6 statistics components
│   ├── ui/            # 50+ shadcn/ui components
│   ├── ErrorBoundary.tsx
│   └── ErrorLoggerProvider.tsx
├── hooks/             # 32 custom hooks
├── contexts/          # 3 React contexts
├── pages/             # 10 pages + 8 admin pages
├── types/             # 12 type definition files
├── lib/               # Utility functions
└── integrations/      # Supabase client & types

supabase/
├── functions/         # 6 edge functions
├── migrations/        # Database migrations
└── config.toml        # Supabase configuration

docs/                  # Documentation files
```
