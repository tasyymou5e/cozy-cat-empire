import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminTestDashboard from "@/pages/admin/AdminTestDashboard";

export const Route = createFileRoute("/catking/tests")({
  component: () => (
    <AdminRoute>
      <AdminTestDashboard />
    </AdminRoute>
  ),
});
