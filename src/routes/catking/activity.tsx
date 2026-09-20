import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminPlayerActivity from "@/pages/admin/AdminPlayerActivity";

export const Route = createFileRoute("/catking/activity")({
  component: () => (
    <AdminRoute>
      <AdminPlayerActivity />
    </AdminRoute>
  ),
});
