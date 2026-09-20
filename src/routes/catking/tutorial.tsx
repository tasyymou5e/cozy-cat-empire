import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminTutorialAnalytics from "@/pages/admin/AdminTutorialAnalytics";

export const Route = createFileRoute("/catking/tutorial")({
  component: () => (
    <AdminRoute>
      <AdminTutorialAnalytics />
    </AdminRoute>
  ),
});
