// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// paper.js (vector cat avatars) is browser-only and pulls jsdom into the server
// bundle, where it cannot build. It is only ever reached from client-side dynamic
// imports, so every server-side build resolves it to a stub instead.
const paperServerStub = fileURLToPath(new URL("./src/lib/paper-server-stub.ts", import.meta.url));

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "stub-paper-on-server",
        enforce: "pre" as const,
        resolveId(id, _importer, options) {
          if (id === "paper" && options?.ssr) return paperServerStub;
          return null;
        },
      },
    ],
  },
});
