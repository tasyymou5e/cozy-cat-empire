import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminTelemetry from "@/pages/admin/AdminTelemetry";

export const Route = createFileRoute("/catking/telemetry")({
  component: () => (
    <AdminRoute>
      <AdminTelemetry />
    </AdminRoute>
  ),
});
