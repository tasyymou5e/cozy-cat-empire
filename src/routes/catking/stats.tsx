import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminStatistics from "@/pages/admin/AdminStatistics";

export const Route = createFileRoute("/catking/stats")({
  component: () => (
    <AdminRoute>
      <AdminStatistics />
    </AdminRoute>
  ),
});
