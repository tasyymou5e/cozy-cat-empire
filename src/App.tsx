import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { SoundProvider } from "./contexts/SoundContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorLoggerProvider } from "./components/ErrorLoggerProvider";
import Index from "./pages/Index";
import CatCollection from "./pages/CatCollection";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SoundProvider>
            <ErrorLoggerProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/collection" element={<CatCollection />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/catking" element={<AdminAuth />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ErrorLoggerProvider>
          </SoundProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
