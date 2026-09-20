import { createFileRoute } from "@tanstack/react-router";
import CatGallery from "@/pages/CatGallery";

export const Route = createFileRoute("/gallery")({
  component: CatGallery,
});
