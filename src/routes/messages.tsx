import { createFileRoute } from "@tanstack/react-router";
import PlayerMessages from "@/pages/PlayerMessages";

export const Route = createFileRoute("/messages")({
  component: PlayerMessages,
});
