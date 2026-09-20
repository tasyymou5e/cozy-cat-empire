import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminWinstonLogs from "@/pages/admin/AdminWinstonLogs";

export const Route = createFileRoute("/catking/winston")({
  component: () => (
    <AdminRoute>
      <AdminWinstonLogs />
    </AdminRoute>
  ),
});
