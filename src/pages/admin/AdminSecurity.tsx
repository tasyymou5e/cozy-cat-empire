import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Users,
  Gift,
  Trophy,
  Camera,
  Bell,
  Gamepad2,
  UserCog,
  Play,
  Loader2,
  Clock,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useSecurityLinter } from '@/hooks/admin/useSecurityLinter';
import { formatDistanceToNow } from 'date-fns';

// Define RLS policy audit data
interface PolicyInfo {
  table: string;
  category: 'core' | 'social' | 'game' | 'progress' | 'admin' | 'logging';
  hasRLS: boolean;
  policies: {
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    name: string;
    hasAdminAccess: boolean;
    isPublic: boolean;
    definition?: string;
  }[];
}

// Static audit data based on current RLS policies
const RLS_AUDIT_DATA: PolicyInfo[] = [
  // Core Tables
  {
    table: 'profiles',
    category: 'core',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view all profiles', hasAdminAccess: true, isPublic: false },
      { operation: 'SELECT', name: 'Users can view own profile', hasAdminAccess: false, isPublic: false },
      { operation: 'INSERT', name: 'handle_new_user trigger', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update own profile', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update profiles', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'user_roles',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view all roles', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Admins can assign roles', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update roles', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can remove roles', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'game_saves',
    category: 'game',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own saves', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all game saves', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create own saves', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update own saves', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'player_stats',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Public leaderboard access', hasAdminAccess: false, isPublic: true },
      { operation: 'INSERT', name: 'Users can create own stats', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update own stats', hasAdminAccess: false, isPublic: false },
    ],
  },
  // Social Tables
  {
    table: 'player_friends',
    category: 'social',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own friendships', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all friendships', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can send friend requests', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update friendships', hasAdminAccess: false, isPublic: false },
      { operation: 'DELETE', name: 'Users can delete friendships', hasAdminAccess: false, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete friendships', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'cat_gifts',
    category: 'social',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own gifts', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all gifts', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can send gifts', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Recipients can update gifts', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update gifts', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete gifts', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'trade_offers',
    category: 'social',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own trades', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all trades', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create trades', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update trades', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update trades', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete trades', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'gallery_photos',
    category: 'social',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own photos', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all photos', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can upload photos', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update own photos', hasAdminAccess: false, isPublic: false },
      { operation: 'DELETE', name: 'Users can delete own photos', hasAdminAccess: false, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete photos', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'coop_challenges',
    category: 'social',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own coop challenges', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all coop challenges', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create coop challenges', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update own challenges', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update coop challenges', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete coop challenges', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'coop_challenge_invites',
    category: 'social',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own invites', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all coop invites', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can send invites', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Recipients can respond', hasAdminAccess: false, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete coop invites', hasAdminAccess: true, isPublic: false },
    ],
  },
  // Progress Tables
  {
    table: 'battle_pass_progress',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own progress', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all battle pass progress', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create progress', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update own progress', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update battle pass progress', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'daily_login_rewards',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own rewards', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all login rewards', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can claim rewards', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update rewards', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update login rewards', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'daily_objectives_progress',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own objectives', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all objectives', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create objectives', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update objectives', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'player_challenge_progress',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own progress', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all challenge progress', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create progress', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update progress', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update challenge progress', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'player_challenge_stats',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own stats', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all challenge stats', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create stats', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update stats', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update challenge stats', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'player_progress',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own progress', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all player progress', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create progress', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update progress', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update player progress', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'player_portrait_credits',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own credits', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all portrait credits', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'System can create credits', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'System can update credits', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update portrait credits', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'leaderboard_rewards',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own rewards', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all leaderboard rewards', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'System can create rewards', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can claim rewards', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update leaderboard rewards', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete leaderboard rewards', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'leaderboard_snapshots',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view all leaderboard snapshots', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'System can create snapshots', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'rank_history',
    category: 'progress',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own history', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all rank history', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'System can create history', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'retired_cats',
    category: 'game',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own retired cats', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all retired cats', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can retire cats', hasAdminAccess: false, isPublic: false },
    ],
  },
  // Admin Tables
  {
    table: 'admin_activity_log',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view activity logs', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Admins can create logs', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'admin_notifications',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view notifications', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Admins can create notifications', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update notifications', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete notifications', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'admin_rate_limits',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view rate limits', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Admins can create rate limits', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update rate limits', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'announcements',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Public can view active announcements', hasAdminAccess: false, isPublic: true },
      { operation: 'INSERT', name: 'Admins can create announcements', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update announcements', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete announcements', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'battle_pass_seasons',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Public can view seasons', hasAdminAccess: false, isPublic: true },
      { operation: 'INSERT', name: 'Admins can create seasons', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update seasons', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete seasons', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'game_config',
    category: 'admin',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Public can view config', hasAdminAccess: false, isPublic: true },
      { operation: 'INSERT', name: 'Admins can create config', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update config', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete config', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'weekly_challenges',
    category: 'game',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Public can view active challenges', hasAdminAccess: false, isPublic: true },
      { operation: 'INSERT', name: 'System/Admins can create challenges', hasAdminAccess: true, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update challenges', hasAdminAccess: true, isPublic: false },
      { operation: 'DELETE', name: 'Admins can delete challenges', hasAdminAccess: true, isPublic: false },
    ],
  },
  // Logging Tables
  {
    table: 'error_logs',
    category: 'logging',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view all errors', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Authenticated can log errors', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Admins can update errors', hasAdminAccess: true, isPublic: false },
    ],
  },
  {
    table: 'auth_attempts_log',
    category: 'logging',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view auth logs', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Anyone can log attempts', hasAdminAccess: false, isPublic: true },
    ],
  },
  {
    table: 'ai_usage_log',
    category: 'logging',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view AI logs', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'System can log AI usage', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'player_activity_log',
    category: 'logging',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own activity', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all activity logs', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can log own activity', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'push_subscriptions',
    category: 'logging',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Users can view own subscriptions', hasAdminAccess: false, isPublic: false },
      { operation: 'SELECT', name: 'Admins can view all push subscriptions', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'Users can create subscriptions', hasAdminAccess: false, isPublic: false },
      { operation: 'UPDATE', name: 'Users can update subscriptions', hasAdminAccess: false, isPublic: false },
      { operation: 'DELETE', name: 'Users can delete subscriptions', hasAdminAccess: false, isPublic: false },
    ],
  },
  {
    table: 'rewards_processing_log',
    category: 'logging',
    hasRLS: true,
    policies: [
      { operation: 'SELECT', name: 'Admins can view processing logs', hasAdminAccess: true, isPublic: false },
      { operation: 'INSERT', name: 'System can log processing', hasAdminAccess: false, isPublic: false },
    ],
  },
];

const CATEGORY_INFO = {
  core: { label: 'Core', icon: Database, color: 'bg-blue-500' },
  social: { label: 'Social', icon: Users, color: 'bg-green-500' },
  game: { label: 'Game Data', icon: Gamepad2, color: 'bg-purple-500' },
  progress: { label: 'Progress', icon: Trophy, color: 'bg-yellow-500' },
  admin: { label: 'Admin', icon: UserCog, color: 'bg-red-500' },
  logging: { label: 'Logging', icon: Bell, color: 'bg-gray-500' },
};

const SECURITY_WARNINGS = [
  {
    level: 'warn',
    title: 'RLS Policy Always True',
    description: 'Some policies use overly permissive expressions like USING (true) for INSERT operations.',
    tables: ['error_logs', 'auth_attempts_log'],
    recommendation: 'Review if these need authentication checks.',
  },
  {
    level: 'info',
    title: 'Public SELECT Policies',
    description: 'Some tables allow public read access (intended for leaderboards, announcements).',
    tables: ['player_stats', 'announcements', 'battle_pass_seasons', 'game_config', 'weekly_challenges'],
    recommendation: 'Verify public access is intentional for these tables.',
  },
];

export default function AdminSecurity() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  
  // Live security linter
  const { 
    results: linterResults, 
    lastScanTime, 
    runLinter, 
    clearCache,
    isScanning 
  } = useSecurityLinter();

  const filteredData =
    selectedCategory === 'all'
      ? RLS_AUDIT_DATA
      : RLS_AUDIT_DATA.filter((item) => item.category === selectedCategory);

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  // Calculate stats
  const stats = {
    totalTables: RLS_AUDIT_DATA.length,
    fullAdminAccess: RLS_AUDIT_DATA.filter((t) =>
      ['SELECT', 'UPDATE', 'DELETE'].every((op) =>
        t.policies.some((p) => p.operation === op && p.hasAdminAccess)
      )
    ).length,
    partialAccess: RLS_AUDIT_DATA.filter((t) => {
      const hasAny = t.policies.some((p) => p.hasAdminAccess);
      const hasFull = ['SELECT', 'UPDATE', 'DELETE'].every((op) =>
        t.policies.some((p) => p.operation === op && p.hasAdminAccess)
      );
      return hasAny && !hasFull;
    }).length,
    noAdminAccess: RLS_AUDIT_DATA.filter((t) => !t.policies.some((p) => p.hasAdminAccess)).length,
  };

  const getOperationIcon = (hasAdminAccess: boolean, isPublic: boolean) => {
    if (hasAdminAccess) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (isPublic) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getTableStatus = (policies: PolicyInfo['policies']) => {
    const hasFullAdmin = ['SELECT', 'UPDATE', 'DELETE'].every((op) =>
      policies.some((p) => p.operation === op && p.hasAdminAccess)
    );
    const hasPartial = policies.some((p) => p.hasAdminAccess);

    if (hasFullAdmin) return { icon: ShieldCheck, color: 'text-green-500', label: 'Full Access' };
    if (hasPartial) return { icon: Shield, color: 'text-yellow-500', label: 'Partial Access' };
    return { icon: ShieldX, color: 'text-red-500', label: 'User Only' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Security Audit
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive RLS policy audit for admin moderation access
            </p>
          </div>
          <div className="flex gap-2">
            {lastScanTime && (
              <Button variant="ghost" size="sm" onClick={clearCache} title="Clear cached results">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm" 
              onClick={runLinter}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Security Scan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Linter Results */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Live Security Scan
              </div>
              {lastScanTime && (
                <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(lastScanTime), { addSuffix: true })}
                </div>
              )}
            </CardTitle>
            <CardDescription>
              {linterResults 
                ? `Scanned in ${linterResults.scanDurationMs}ms` 
                : 'Click "Run Security Scan" to check your database security'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!linterResults && !isScanning && (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scan results yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={runLinter}>
                  Run First Scan
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-muted-foreground">Scanning database security...</p>
              </div>
            )}

            {linterResults && !isScanning && (
              <div className="space-y-4">
                {/* Scan Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{linterResults.totalIssues}</p>
                    <p className="text-xs text-muted-foreground">Total Issues</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10 text-center">
                    <p className="text-2xl font-bold text-destructive">{linterResults.errors}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{linterResults.warnings}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-600">{linterResults.infos}</p>
                    <p className="text-xs text-muted-foreground">Info</p>
                  </div>
                </div>

                {/* Issue Cards */}
                {linterResults.issues.length === 0 ? (
                  <div className="text-center py-6 text-green-600">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-medium">No security issues detected!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linterResults.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-lg border ${
                          issue.level === 'error' 
                            ? 'border-destructive/50 bg-destructive/5' 
                            : issue.level === 'warn'
                            ? 'border-yellow-500/50 bg-yellow-500/5'
                            : 'border-blue-500/50 bg-blue-500/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {issue.level === 'error' ? (
                            <XCircle className="h-5 w-5 mt-0.5 text-destructive" />
                          ) : issue.level === 'warn' ? (
                            <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 mt-0.5 text-blue-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{issue.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  issue.level === 'error' ? 'border-destructive text-destructive' :
                                  issue.level === 'warn' ? 'border-yellow-500 text-yellow-600' :
                                  'border-blue-500 text-blue-600'
                                }`}
                              >
                                {issue.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                            {issue.tables && issue.tables.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {issue.tables.map((table) => (
                                  <Badge key={table} variant="secondary" className="text-xs">
                                    {table}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              💡 {issue.recommendation}
                            </p>
                            {issue.docLink && (
                              <a 
                                href={issue.docLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                              >
                                View Documentation <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTables}</p>
                  <p className="text-sm text-muted-foreground">Total Tables</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.fullAdminAccess}</p>
                  <p className="text-sm text-muted-foreground">Full Admin Access</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Shield className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.partialAccess}</p>
                  <p className="text-sm text-muted-foreground">Partial Access</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <ShieldX className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.noAdminAccess}</p>
                  <p className="text-sm text-muted-foreground">User Only</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Static Security Warnings (kept for reference) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Known Security Considerations
            </CardTitle>
            <CardDescription>Pre-documented policy patterns to review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SECURITY_WARNINGS.map((warning, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    warning.level === 'warn' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-blue-500/50 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${warning.level === 'warn' ? 'text-yellow-500' : 'text-blue-500'}`}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{warning.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{warning.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {warning.tables.map((table) => (
                          <Badge key={table} variant="outline" className="text-xs">
                            {table}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        💡 {warning.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Policy Audit Table */}
        <Card>
          <CardHeader>
            <CardTitle>RLS Policy Breakdown</CardTitle>
            <CardDescription>Detailed view of all tables and their access policies</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All ({RLS_AUDIT_DATA.length})</TabsTrigger>
                {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                  const count = RLS_AUDIT_DATA.filter((t) => t.category === key).length;
                  return (
                    <TabsTrigger key={key} value={key} className="gap-1">
                      <info.icon className="h-3 w-3" />
                      {info.label} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-0">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Table</TableHead>
                        <TableHead className="w-[100px]">Category</TableHead>
                        <TableHead className="text-center">SELECT</TableHead>
                        <TableHead className="text-center">INSERT</TableHead>
                        <TableHead className="text-center">UPDATE</TableHead>
                        <TableHead className="text-center">DELETE</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => {
                        const status = getTableStatus(item.policies);
                        const isExpanded = expandedTables.has(item.table);

                        const getOpStatus = (op: string) => {
                          const policy = item.policies.find((p) => p.operation === op);
                          if (!policy) return { hasAdmin: false, isPublic: false };
                          return {
                            hasAdmin: item.policies.some((p) => p.operation === op && p.hasAdminAccess),
                            isPublic: item.policies.some((p) => p.operation === op && p.isPublic),
                          };
                        };

                        return (
                          <>
                            <TableRow
                              key={item.table}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleTable(item.table)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                  {item.table}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={`${CATEGORY_INFO[item.category].color} text-white`}
                                >
                                  {CATEGORY_INFO[item.category].label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {getOperationIcon(getOpStatus('SELECT').hasAdmin, getOpStatus('SELECT').isPublic)}
                              </TableCell>
                              <TableCell className="text-center">
                                {getOperationIcon(getOpStatus('INSERT').hasAdmin, getOpStatus('INSERT').isPublic)}
                              </TableCell>
                              <TableCell className="text-center">
                                {getOperationIcon(getOpStatus('UPDATE').hasAdmin, getOpStatus('UPDATE').isPublic)}
                              </TableCell>
                              <TableCell className="text-center">
                                {getOperationIcon(getOpStatus('DELETE').hasAdmin, getOpStatus('DELETE').isPublic)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <status.icon className={`h-4 w-4 ${status.color}`} />
                                  <span className={`text-xs ${status.color}`}>{status.label}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Policy Details:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {item.policies.map((policy, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 text-sm p-2 rounded bg-background"
                                        >
                                          <Badge variant="outline" className="w-16 justify-center">
                                            {policy.operation}
                                          </Badge>
                                          {policy.hasAdminAccess && (
                                            <Badge className="bg-green-500">Admin</Badge>
                                          )}
                                          {policy.isPublic && (
                                            <Badge className="bg-yellow-500">Public</Badge>
                                          )}
                                          <span className="text-muted-foreground truncate">
                                            {policy.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Admin has access</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Public access (no auth required)</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">User-only access</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-sm">Full admin moderation access</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Partial admin access</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
