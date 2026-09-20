import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { CatReactionProvider } from "@/contexts/CatReactionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorLoggerProvider } from "@/components/ErrorLoggerProvider";
import { TrackingScripts } from "@/components/TrackingScripts";
import { RouteMeta } from "@/components/RouteMeta";
import { GraphicsMotionGate } from "@/components/GraphicsMotionGate";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import appCss from "../styles.css?url";

const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.cozycatempire.com/#organization",
      name: "Cozy Cat Empire",
      url: "https://www.cozycatempire.com/",
      logo: "https://www.cozycatempire.com/favicon.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.cozycatempire.com/#website",
      name: "Cozy Cat Empire",
      url: "https://www.cozycatempire.com/",
      description:
        "Build your cat empire! Collect strays, adopted and pure breed cats, do chores, enter cat shows, and upgrade from apartment to farm.",
      publisher: { "@id": "https://www.cozycatempire.com/#organization" },
    },
    {
      "@type": "VideoGame",
      name: "Cozy Cat Empire",
      url: "https://www.cozycatempire.com/",
      applicationCategory: "Game",
      gamePlatform: "Web browser",
      operatingSystem: "Any",
      publisher: { "@id": "https://www.cozycatempire.com/#organization" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "Cozy Cat Empire - Build Your Purr-fect Cat Empire! 🐱" },
      {
        name: "description",
        content:
          "Build your cat empire! Collect strays, adopted and pure breed cats. Do chores, enter cat shows, and upgrade from apartment to farm!",
      },
      { name: "author", content: "Lovable" },
      { name: "theme-color", content: "#f97316" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Cat Empire" },
      {
        property: "og:title",
        content: "Cozy Cat Empire - Build Your Purr-fect Cat Empire!",
      },
      {
        property: "og:description",
        content:
          "A fun cozy game for raising your cat empire! Collect strays, adopt cats, breed kittens, and grow from apartment to farm.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Cozy Cat Empire" },
      { property: "og:url", content: "https://www.cozycatempire.com/" },
      { property: "og:image", content: "https://www.cozycatempire.com/og-share.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      {
        name: "twitter:title",
        content: "Cozy Cat Empire - Build Your Purr-fect Cat Empire!",
      },
      {
        name: "twitter:description",
        content:
          "A fun cozy game for raising your cat empire! Collect strays, adopt cats, breed kittens, and grow from apartment to farm.",
      },
      { name: "twitter:image", content: "https://www.cozycatempire.com/og-share.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap",
      },
    ],
    scripts: [{ type: "application/ld+json", children: JSON_LD }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // ported from main.tsx — registers the service worker used for push notifications
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        intervalId = setInterval(
          () => {
            void registration.update();
          },
          60 * 60 * 1000,
        );
      })
      .catch((error: unknown) => {
        console.warn(
          "ServiceWorker registration skipped:",
          error instanceof Error ? error.message : error,
        );
      });
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <ErrorBoundary componentName="App">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SoundProvider>
              <CatReactionProvider>
                <ErrorLoggerProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <RouteMeta />
                    <TrackingScripts />
                    <GraphicsMotionGate />
                    <Outlet />
                  </TooltipProvider>
                </ErrorLoggerProvider>
              </CatReactionProvider>
            </SoundProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <span className="text-6xl inline-block">🙈</span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          That page has wandered off like a curious cat.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md text-center px-6">
        <h1 className="text-2xl font-bold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-muted-foreground">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-border bg-card px-4 py-2 font-semibold text-card-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
