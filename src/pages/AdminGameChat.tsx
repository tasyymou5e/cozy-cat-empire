/**
 * @fileoverview In-game admin chat panel.
 *
 * Lets admins message players (and read replies) without leaving the game
 * shell. Reuses the same inbox as the admin portal (/catking/messages).
 *
 * Route: /admin-chat (admin role required)
 */
import { Link } from '@/lib/router-compat';
import { GameLayout } from '@/components/layouts/GameLayout';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { AdminPlayerInbox } from '@/pages/admin/AdminPlayerMessages';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function AdminGameChat() {
  const { isAdmin, loading, user } = useAdminAuth();

  return (
    <GameLayout currentPage="/admin-chat">
      <div className="max-w-6xl mx-auto w-full space-y-4 p-4">
        <Breadcrumbs items={[{ label: 'Cat Farm', href: '/' }, { label: 'Admin Chat' }]} />

        {loading || (user && !isAdmin) ? (
          loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-[420px] w-full" />
            </div>
          ) : (
            <div className="glass-panel rounded-lg p-8 text-center space-y-3 max-w-md mx-auto">
              <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-semibold">Admins only</h2>
              <p className="text-sm text-muted-foreground">
                This panel is for the Cat Farm team. Sign in with an admin account to message
                players from here.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/">Back to Game</Link>
              </Button>
            </div>
          )
        ) : !user ? (
          <div className="glass-panel rounded-lg p-8 text-center space-y-3 max-w-md mx-auto">
            <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sign in required</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with an admin account to open the player chat.
            </p>
            <Button asChild size="sm">
              <Link to="/auth">Log In</Link>
            </Button>
          </div>
        ) : (
          <AdminPlayerInbox />
        )}
      </div>
    </GameLayout>
  );
}
