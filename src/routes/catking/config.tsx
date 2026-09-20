import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminGameConfig from "@/pages/admin/AdminGameConfig";

export const Route = createFileRoute("/catking/config")({
  component: () => (
    <AdminRoute>
      <AdminGameConfig />
    </AdminRoute>
  ),
});
