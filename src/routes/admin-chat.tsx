import { createFileRoute } from "@tanstack/react-router";
import AdminGameChat from "@/pages/AdminGameChat";

export const Route = createFileRoute("/admin-chat")({
  component: AdminGameChat,
});
