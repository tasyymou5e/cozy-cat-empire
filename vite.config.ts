// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // paper (vector cat avatars) is browser-only and drags jsdom into the server
    // bundle, where it cannot build. It is only ever reached from client-side
    // dynamic imports, so stub it out in every server-side environment.
    environments: {
      ssr: {
        resolve: {
          alias: [{ find: /^paper$/, replacement: "/src/lib/paper-server-stub.ts" }],
        },
      },
      nitro: {
        resolve: {
          alias: [{ find: /^paper$/, replacement: "/src/lib/paper-server-stub.ts" }],
        },
      },
    },
  },
});
