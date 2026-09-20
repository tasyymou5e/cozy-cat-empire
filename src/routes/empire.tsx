import { createFileRoute } from "@tanstack/react-router";
import Empire from "@/pages/Empire";

export const Route = createFileRoute("/empire")({
  component: Empire,
});
