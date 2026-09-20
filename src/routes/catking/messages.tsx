import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminPlayerMessages from "@/pages/admin/AdminPlayerMessages";

export const Route = createFileRoute("/catking/messages")({
  component: () => (
    <AdminRoute>
      <AdminPlayerMessages />
    </AdminRoute>
  ),
});
