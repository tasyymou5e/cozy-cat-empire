import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminProfileRepair from "@/pages/admin/AdminProfileRepair";

export const Route = createFileRoute("/catking/profiles")({
  component: () => (
    <AdminRoute>
      <AdminProfileRepair />
    </AdminRoute>
  ),
});
