import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminSaveRecovery from "@/pages/admin/AdminSaveRecovery";

export const Route = createFileRoute("/catking/save-recovery")({
  component: () => (
    <AdminRoute>
      <AdminSaveRecovery />
    </AdminRoute>
  ),
});
