# Pages and Components Reference

This document provides a comprehensive overview of all pages and components in the Cat Farm game.

---

## Pages

### Main Game Pages

| Page | File | Route | Description |
|------|------|-------|-------------|
| Index | `src/pages/Index.tsx` | `/` | Main game page with CatFarm component |
| Auth | `src/pages/Auth.tsx` | `/auth` | User authentication (login/signup) |
| Cat Collection | `src/pages/CatCollection.tsx` | `/collection` | View all owned cats |
| Cat Customization | `src/pages/CatCustomization.tsx` | `/customize` | Customize cat appearance |
| Cat Gallery | `src/pages/CatGallery.tsx` | `/gallery` | Photo gallery of cats |
| Cat Photo Booth | `src/pages/CatPhotoBooth.tsx` | `/photo-booth` | Take photos of cats |
| Leaderboard | `src/pages/Leaderboard.tsx` | `/leaderboard` | Global player rankings |
| Stats | `src/pages/Stats.tsx` | `/stats` | Player statistics dashboard |
| Not Found | `src/pages/NotFound.tsx` | `*` | 404 error page |

### Admin Pages

| Page | File | Route | Description |
|------|------|-------|-------------|
| Admin Auth | `src/pages/AdminAuth.tsx` | `/admin/auth` | Admin login |
| Admin Dashboard | `src/pages/admin/AdminDashboard.tsx` | `/admin` | Main admin dashboard |
| Admin Users | `src/pages/admin/AdminUsers.tsx` | `/admin/users` | User management |
| Admin Statistics | `src/pages/admin/AdminStatistics.tsx` | `/admin/statistics` | Game statistics |
| Admin Moderation | `src/pages/admin/AdminModeration.tsx` | `/admin/moderation` | Content moderation |
| Admin Announcements | `src/pages/admin/AdminAnnouncements.tsx` | `/admin/announcements` | System announcements |
| Admin AI Metrics | `src/pages/admin/AdminAIMetrics.tsx` | `/admin/ai-metrics` | AI usage metrics |
| Admin Error Logs | `src/pages/admin/AdminErrorLogs.tsx` | `/admin/error-logs` | Error log viewer |
| Admin Settings | `src/pages/admin/AdminSettings.tsx` | `/admin/settings` | Admin settings |

---

## Components

### Game Components (`src/components/game/`)

#### Core Game UI

| Component | Description |
|-----------|-------------|
| `CatFarm.tsx` | Main game hub - manages all game state, panels, and interactions |
| `StatusBar.tsx` | Displays resources (money, food, toys, medicine), day count, and quick actions |
| `StatusBarSkeleton.tsx` | Loading skeleton for StatusBar |
| `MessageBar.tsx` | Displays game messages with auto-dismiss for success messages |
| `ActionPanel.tsx` | Main action buttons (feed, play, heal, etc.) |
| `ResourcePanel.tsx` | Resource management and purchasing |

#### Cat Display

| Component | Description |
|-----------|-------------|
| `CatCard.tsx` | Individual cat display card with stats and actions |
| `CatCardSkeleton.tsx` | Loading skeleton for CatCard |
| `CatGridSkeleton.tsx` | Loading skeleton for cat grid |
| `CatAvatar.tsx` | Cat avatar/icon display |
| `CatPortrait.tsx` | AI portrait generation with confirmation dialogs |
| `BatchPortraitGenerator.tsx` | Batch generate portraits for multiple cats |
| `CatDetailModal.tsx` | Modal with full cat details |
| `CatCardReaction.tsx` | Animated reactions on cat cards |
| `CatActivityPopups.tsx` | Activity notification popups |

#### Trading Cards

| Component | Description |
|-----------|-------------|
| `TradingCard.tsx` | Cat trading card display |
| `FlippableTradingCard.tsx` | Trading card with flip animation |
| `GalleryPhotoCard.tsx` | Photo card in gallery view |

#### Panels & Features

| Component | Description |
|-----------|-------------|
| `MarketPanel.tsx` | Buy/sell cats marketplace |
| `BreedingPanel.tsx` | Cat breeding interface |
| `TrainingPanel.tsx` | Cat training and skills |
| `ChorePanel.tsx` | Daily chores management |
| `CatShowPanel.tsx` | Cat show competitions |
| `MatchmakingPanel.tsx` | Find cats for breeding/shows |

#### Social Features

| Component | Description |
|-----------|-------------|
| `FriendsPanel.tsx` | Friends list and management |
| `SocializePanel.tsx` | Cat socialization features |
| `CatGiftingPanel.tsx` | Gift cats to friends |
| `TradingPanel.tsx` | Trade cats with other players |
| `GiftReceivedDialog.tsx` | Dialog when receiving a gift |
| `TradeReceivedDialog.tsx` | Dialog when receiving a trade offer |
| `GroupActivitiesPanel.tsx` | Multiplayer group activities |

#### Leaderboards & Rankings

| Component | Description |
|-----------|-------------|
| `LeaderboardPanel.tsx` | Local leaderboard display |
| `GlobalLeaderboardPanel.tsx` | Global rankings |
| `LeaderboardHistoryChart.tsx` | Rank history over time |
| `LeaderboardRewardsPanel.tsx` | Leaderboard reward claiming |
| `GradeBadge.tsx` | Cat grade/rank badge display |

#### Achievements & Challenges

| Component | Description |
|-----------|-------------|
| `AchievementsPanel.tsx` | Achievements display and tracking |
| `WeeklyChallengesPanel.tsx` | Weekly challenge objectives |
| `ChallengeProgressAnimation.tsx` | Animated challenge progress |
| `DailyRewardsPanel.tsx` | Daily login rewards |

#### Player Profile

| Component | Description |
|-----------|-------------|
| `PlayerProfilePanel.tsx` | Player profile display |
| `ProfileSetupDialog.tsx` | Initial profile setup |
| `SaveLoadPanel.tsx` | Save/load game functionality |

#### Relationships

| Component | Description |
|-----------|-------------|
| `RelationshipPanel.tsx` | Cat relationships overview with 5 tabs (Bonds, Calendar, Network, Groups, History) |
| `RelationshipNetworkGraph.tsx` | Visual relationship graph |
| `RelationshipDirectory.tsx` | Grid view of relationship pairs with filtering |
| `CatSocialProfile.tsx` | Individual cat social profile view |
| `FullScreenNetworkGraph.tsx` | Enhanced full-page network visualization |
| `SocialCalendarPanel.tsx` | Relationship maintenance urgency view |
| `RelationshipAnimations.tsx` | Relationship interaction animations |
| `RelationshipParticles.tsx` | Particle effects for relationships |

#### Photo Booth

| Component | Description |
|-----------|-------------|
| `PhotoBooth.tsx` | Main photo booth interface |
| `PhotoLightbox.tsx` | Fullscreen photo viewer |
| `DraggableSticker.tsx` | Draggable stickers for photos |

#### Customization

| Component | Description |
|-----------|-------------|
| `CostumeShopPanel.tsx` | Cat costume shop |
| `ComfortButton.tsx` | Comfort action button |

#### Notifications & Tutorials

| Component | Description |
|-----------|-------------|
| `NotificationCenter.tsx` | In-app notifications hub |
| `NotificationSettings.tsx` | Notification preferences |
| `TutorialSystem.tsx` | Game tutorial/onboarding |
| `KeyboardShortcutsHelp.tsx` | Keyboard shortcuts reference |
| `WhatsNewPopup.tsx` | New features announcement |
| `AnnouncementBanner.tsx` | System announcements |
| `DailyEventToast.tsx` | Daily event notifications |

#### Animations & Effects

| Component | Description |
|-----------|-------------|
| `MoodAnimations.tsx` | Cat mood visual effects |
| `PanelSkeleton.tsx` | Generic panel loading skeleton |

---

### Admin Components (`src/components/admin/`)

| Component | Description |
|-----------|-------------|
| `AdminLayout.tsx` | Admin panel layout wrapper |
| `AdminRoute.tsx` | Protected admin route wrapper |
| `ActivityFeed.tsx` | Admin activity feed |
| `BulkActionsBar.tsx` | Bulk user actions toolbar |
| `ChallengeForm.tsx` | Create/edit challenges form |
| `ExportButton.tsx` | Data export functionality |
| `UserDetailModal.tsx` | User details modal |

---

### Stats Components (`src/components/stats/`)

| Component | Description |
|-----------|-------------|
| `StatsOverviewCards.tsx` | Summary statistics cards |
| `AchievementShowcase.tsx` | Achievement display |
| `CategoryPerformanceChart.tsx` | Performance by category chart |
| `LeaderboardRankings.tsx` | Ranking display |
| `RankProgressionChart.tsx` | Rank over time chart |
| `RewardsHistory.tsx` | Reward history display |
| `WealthProgressionChart.tsx` | Money/wealth over time chart |

---

### UI Components (`src/components/ui/`)

#### Custom UI Components

| Component | Description |
|-----------|-------------|
| `AnimatedBackground.tsx` | Animated page background |
| `FloatingDecorations.tsx` | Floating decorative elements |
| `GlassCard.tsx` | Glassmorphism card style |
| `LoadingCat.tsx` | Cat-themed loading spinner |

#### Shadcn UI Components

Standard shadcn/ui components available:
- `accordion.tsx` - Collapsible sections
- `alert-dialog.tsx` - Confirmation dialogs
- `alert.tsx` - Alert messages
- `aspect-ratio.tsx` - Aspect ratio container
- `avatar.tsx` - User/cat avatars
- `badge.tsx` - Status badges
- `breadcrumb.tsx` - Navigation breadcrumbs
- `button.tsx` - Buttons with variants
- `calendar.tsx` - Date picker calendar
- `card.tsx` - Content cards
- `carousel.tsx` - Image/content carousel
- `chart.tsx` - Chart wrapper (Recharts)
- `checkbox.tsx` - Checkbox input
- `collapsible.tsx` - Collapsible container
- `command.tsx` - Command palette
- `context-menu.tsx` - Right-click menu
- `dialog.tsx` - Modal dialogs
- `drawer.tsx` - Slide-out drawer
- `dropdown-menu.tsx` - Dropdown menus
- `form.tsx` - Form components with react-hook-form
- `hover-card.tsx` - Hover preview card
- `input-otp.tsx` - OTP/code input
- `input.tsx` - Text input
- `label.tsx` - Form labels
- `menubar.tsx` - Menu bar
- `navigation-menu.tsx` - Navigation menu
- `pagination.tsx` - Pagination controls
- `popover.tsx` - Popover content
- `progress.tsx` - Progress bar
- `radio-group.tsx` - Radio buttons
- `resizable.tsx` - Resizable panels
- `scroll-area.tsx` - Custom scrollbar
- `select.tsx` - Select dropdown
- `separator.tsx` - Visual separator
- `sheet.tsx` - Slide-out sheet
- `sidebar.tsx` - Sidebar navigation
- `skeleton.tsx` - Loading skeleton
- `slider.tsx` - Range slider
- `sonner.tsx` - Toast notifications (Sonner)
- `switch.tsx` - Toggle switch
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation
- `textarea.tsx` - Multi-line text input
- `toast.tsx` - Toast notification
- `toaster.tsx` - Toast container
- `toggle-group.tsx` - Toggle button group
- `toggle.tsx` - Toggle button
- `tooltip.tsx` - Tooltip

---

### Utility Components

| Component | File | Description |
|-----------|------|-------------|
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | React error boundary |
| `ErrorLoggerProvider` | `src/components/ErrorLoggerProvider.tsx` | Error logging context |
| `NavLink` | `src/components/NavLink.tsx` | Active-aware navigation link |

---

## Contexts

| Context | File | Description |
|---------|------|-------------|
| `AuthContext` | `src/contexts/AuthContext.tsx` | User authentication state |
| `CatReactionContext` | `src/contexts/CatReactionContext.tsx` | Cat reaction animations |
| `SoundContext` | `src/contexts/SoundContext.tsx` | Sound effects management |

---

## Hooks

### Game Hooks

| Hook | Description |
|------|-------------|
| `useGameState` | Core game state management |
| `useRelationships` | Cat relationship system with decay and maintenance streak |
| `useRelationshipReminders` | Toast notifications for neglected relationships |
| `usePhotoGallery` | Photo gallery management |
| `useCatGifts` | Cat gifting functionality |
| `useTrading` | Trading system |
| `useFriends` | Friends list management |
| `useWeeklyChallenges` | Weekly challenges tracking |
| `useChallengeAchievements` | Achievement unlocking |
| `useDailyLoginRewards` | Daily login rewards |
| `useCloudSave` | Cloud save/load |
| `useCloudGallery` | Cloud photo storage |
| `useMilestones` | Milestone celebration tracking |
| `useLegacy` | Cat retirement/Hall of Fame |
| `useCollectionProgress` | Collection completion tracking |
| `useSpecializations` | Cat specialization paths |
| `useLuckyWheel` | Lucky wheel spin system |
| `useCoopChallenges` | Cooperative friend challenges |
| `useBattlePass` | Seasonal battle pass |
| `useDailyObjectives` | Daily objectives tracking |

### Leaderboard Hooks

| Hook | Description |
|------|-------------|
| `useGlobalLeaderboard` | Global rankings data |
| `useLeaderboardHistory` | Rank history over time |
| `useLeaderboardRewards` | Leaderboard rewards |
| `usePlayerStats` | Player statistics |
| `usePlayerProfile` | Player profile data |
| `usePlayerActivityLog` | Activity logging |

### Admin Hooks

| Hook | Description |
|------|-------------|
| `useAdminAuth` | Admin authentication |
| `useAdminData` | Admin dashboard data |
| `useAdminAIData` | AI metrics data |
| `useAdminActivityLog` | Admin activity logging |

### Utility Hooks

| Hook | Description |
|------|-------------|
| `useNotifications` | In-app notifications |
| `usePushNotifications` | Push notification subscription |
| `useSoundEffects` | Sound effect playback |
| `useConfetti` | Confetti animations |
| `useHaptics` | Haptic feedback |
| `useKeyboardShortcuts` | Keyboard shortcut handling |
| `useInfiniteScroll` | Infinite scroll pagination |
| `useErrorLogger` | Error logging to database |
| `use-mobile` | Mobile device detection |
| `use-toast` | Toast notifications |

---

## Type Definitions

| File | Description |
|------|-------------|
| `types/game.ts` | Core game types (Cat, GameState, etc.) |
| `types/catAppearance.ts` | Cat appearance customization |
| `types/relationships.ts` | Relationship types, decay info, warning helpers |
| `types/challenges.ts` | Challenge definitions |
| `types/dailyRewards.ts` | Daily reward tiers |
| `types/dailyEvents.ts` | Daily event types |
| `types/dailyObjectives.ts` | Daily objectives system |
| `types/showEvents.ts` | Cat show events |
| `types/costumes.ts` | Costume definitions |
| `types/gallery.ts` | Photo gallery types |
| `types/photoBooth.ts` | Photo booth options |
| `types/grading.ts` | Cat grading system |
| `types/changelog.ts` | Changelog entries |
| `types/milestones.ts` | Milestone celebration system |
| `types/legacy.ts` | Cat legacy/retirement system |
| `types/collections.ts` | Collection progress tracking |
| `types/specializations.ts` | Cat specialization paths |
| `types/luckyWheel.ts` | Lucky wheel prizes |
| `types/coopChallenges.ts` | Cooperative challenges |
| `types/battlePass.ts` | Battle pass tiers and rewards |
| `lib/portraitUtils.ts` | Portrait hash and outdated detection utilities |
