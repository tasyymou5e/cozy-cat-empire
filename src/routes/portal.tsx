import { createFileRoute } from "@tanstack/react-router";
import PlayerPortal from "@/pages/PlayerPortal";

export const Route = createFileRoute("/portal")({
  component: PlayerPortal,
});
