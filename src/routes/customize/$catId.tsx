import { createFileRoute } from "@tanstack/react-router";
import CatCustomization from "@/pages/CatCustomization";

export const Route = createFileRoute("/customize/$catId")({
  component: CatCustomization,
});
