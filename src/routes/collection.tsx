import { createFileRoute } from "@tanstack/react-router";
import CatCollection from "@/pages/CatCollection";

export const Route = createFileRoute("/collection")({
  component: CatCollection,
});
