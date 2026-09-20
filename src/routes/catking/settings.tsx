import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminSettings from "@/pages/admin/AdminSettings";

export const Route = createFileRoute("/catking/settings")({
  component: () => (
    <AdminRoute>
      <AdminSettings />
    </AdminRoute>
  ),
});
