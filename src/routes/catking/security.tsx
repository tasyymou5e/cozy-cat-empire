import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminSecurity from "@/pages/admin/AdminSecurity";

export const Route = createFileRoute("/catking/security")({
  component: () => (
    <AdminRoute>
      <AdminSecurity />
    </AdminRoute>
  ),
});
