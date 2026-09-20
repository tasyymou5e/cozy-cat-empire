import { createFileRoute } from "@tanstack/react-router";
import CatRelationships from "@/pages/CatRelationships";

export const Route = createFileRoute("/relationships")({
  component: CatRelationships,
});
