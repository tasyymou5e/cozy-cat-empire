import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminScheduledJobs from "@/pages/admin/AdminScheduledJobs";

export const Route = createFileRoute("/catking/scheduled-jobs")({
  component: () => (
    <AdminRoute>
      <AdminScheduledJobs />
    </AdminRoute>
  ),
});
