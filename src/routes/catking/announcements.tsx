import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";

export const Route = createFileRoute("/catking/announcements")({
  component: () => (
    <AdminRoute>
      <AdminAnnouncements />
    </AdminRoute>
  ),
});
