import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminGameSaveRepair from "@/pages/admin/AdminGameSaveRepair";

export const Route = createFileRoute("/catking/game-repair")({
  component: () => (
    <AdminRoute>
      <AdminGameSaveRepair />
    </AdminRoute>
  ),
});
