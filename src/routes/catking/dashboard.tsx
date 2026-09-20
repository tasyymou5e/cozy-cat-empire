import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminDashboard from "@/pages/admin/AdminDashboard";

export const Route = createFileRoute("/catking/dashboard")({
  component: () => (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  ),
});
