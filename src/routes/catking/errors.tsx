import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminErrorLogs from "@/pages/admin/AdminErrorLogs";

export const Route = createFileRoute("/catking/errors")({
  component: () => (
    <AdminRoute>
      <AdminErrorLogs />
    </AdminRoute>
  ),
});
