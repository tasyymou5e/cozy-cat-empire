import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminDocs from "@/pages/admin/AdminDocs";

export const Route = createFileRoute("/catking/docs")({
  component: () => (
    <AdminRoute>
      <AdminDocs />
    </AdminRoute>
  ),
});
