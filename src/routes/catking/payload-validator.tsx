import { createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AdminPayloadValidator from "@/pages/admin/AdminPayloadValidator";

export const Route = createFileRoute("/catking/payload-validator")({
  component: () => (
    <AdminRoute>
      <AdminPayloadValidator />
    </AdminRoute>
  ),
});
