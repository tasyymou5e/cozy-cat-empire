import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminAIMetrics from "@/pages/admin/AdminAIMetrics";

export const Route = createFileRoute("/catking/ai-metrics")({
  component: () => (
    <AdminRoute>
      <AdminAIMetrics />
    </AdminRoute>
  ),
});
