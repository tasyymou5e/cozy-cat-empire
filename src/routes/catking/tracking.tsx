import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminTracking from "@/pages/admin/AdminTracking";

export const Route = createFileRoute("/catking/tracking")({
  component: () => (
    <AdminRoute>
      <AdminTracking />
    </AdminRoute>
  ),
});
