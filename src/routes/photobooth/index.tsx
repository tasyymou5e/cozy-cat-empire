import { createFileRoute } from "@tanstack/react-router";
import CatPhotoBooth from "@/pages/CatPhotoBooth";

export const Route = createFileRoute("/photobooth/")({
  component: CatPhotoBooth,
});
