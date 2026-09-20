import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminBattlePass from "@/pages/admin/AdminBattlePass";

export const Route = createFileRoute("/catking/battle-pass")({
  component: () => (
    <AdminRoute>
      <AdminBattlePass />
    </AdminRoute>
  ),
});
