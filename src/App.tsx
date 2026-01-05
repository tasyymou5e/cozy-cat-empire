import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { SoundProvider } from "./contexts/SoundContext";
import { CatReactionProvider } from "./contexts/CatReactionContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorLoggerProvider } from "./components/ErrorLoggerProvider";
import { AdminRoute } from "./components/admin/AdminRoute";
import Index from "./pages/Index";
import CatCollection from "./pages/CatCollection";
import CatCustomization from "./pages/CatCustomization";
import CatPhotoBooth from "./pages/CatPhotoBooth";
import CatGallery from "./pages/CatGallery";
import CatRelationships from "./pages/CatRelationships";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminErrorLogs from "./pages/admin/AdminErrorLogs";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAIMetrics from "./pages/admin/AdminAIMetrics";
import AdminGameConfig from "./pages/admin/AdminGameConfig";
import AdminBattlePass from "./pages/admin/AdminBattlePass";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminProfileRepair from "./pages/admin/AdminProfileRepair";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
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
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/collection" element={<CatCollection />} />
                        <Route path="/customize/:catId?" element={<CatCustomization />} />
                        <Route path="/photobooth/:catId?" element={<CatPhotoBooth />} />
                        <Route path="/gallery" element={<CatGallery />} />
                        <Route path="/relationships" element={<CatRelationships />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/catking" element={<AdminAuth />} />
                        <Route path="/catking/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/catking/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/catking/profiles" element={<AdminRoute><AdminProfileRepair /></AdminRoute>} />
                        <Route path="/catking/stats" element={<AdminRoute><AdminStatistics /></AdminRoute>} />
                        <Route path="/catking/ai-metrics" element={<AdminRoute><AdminAIMetrics /></AdminRoute>} />
                        <Route path="/catking/errors" element={<AdminRoute><AdminErrorLogs /></AdminRoute>} />
                        <Route path="/catking/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
                        <Route path="/catking/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                        <Route path="/catking/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
                        <Route path="/catking/config" element={<AdminRoute><AdminGameConfig /></AdminRoute>} />
                        <Route path="/catking/battle-pass" element={<AdminRoute><AdminBattlePass /></AdminRoute>} />
                        <Route path="/catking/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </ErrorLoggerProvider>
              </CatReactionProvider>
            </SoundProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
