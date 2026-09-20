import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminModeration from "@/pages/admin/AdminModeration";

export const Route = createFileRoute("/catking/moderation")({
  component: () => (
    <AdminRoute>
      <AdminModeration />
    </AdminRoute>
  ),
});
