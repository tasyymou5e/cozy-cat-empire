import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminNotifications from "@/pages/admin/AdminNotifications";

export const Route = createFileRoute("/catking/notifications")({
  component: () => (
    <AdminRoute>
      <AdminNotifications />
    </AdminRoute>
  ),
});
