import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminUsers from "@/pages/admin/AdminUsers";

export const Route = createFileRoute("/catking/users")({
  component: () => (
    <AdminRoute>
      <AdminUsers />
    </AdminRoute>
  ),
});
