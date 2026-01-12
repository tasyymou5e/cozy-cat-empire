import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import { CatReactionProvider } from './contexts/CatReactionContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorLoggerProvider } from './components/ErrorLoggerProvider';
import { AdminRoute } from './components/admin/AdminRoute';

// Page loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <span className="text-6xl animate-bounce inline-block">🐱</span>
      <p className="mt-4 text-xl text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load all page components for route-level code splitting
const Index = lazy(() => import('./pages/Index'));
const CatCollection = lazy(() => import('./pages/CatCollection'));
const CatCustomization = lazy(() => import('./pages/CatCustomization'));
const CatPhotoBooth = lazy(() => import('./pages/CatPhotoBooth'));
const CatGallery = lazy(() => import('./pages/CatGallery'));
const CatRelationships = lazy(() => import('./pages/CatRelationships'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Stats = lazy(() => import('./pages/Stats'));
const Auth = lazy(() => import('./pages/Auth'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages - lazy loaded separately
const AdminAuth = lazy(() => import('./pages/AdminAuth'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStatistics = lazy(() => import('./pages/admin/AdminStatistics'));
const AdminErrorLogs = lazy(() => import('./pages/admin/AdminErrorLogs'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminAIMetrics = lazy(() => import('./pages/admin/AdminAIMetrics'));
const AdminGameConfig = lazy(() => import('./pages/admin/AdminGameConfig'));
const AdminBattlePass = lazy(() => import('./pages/admin/AdminBattlePass'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminProfileRepair = lazy(() => import('./pages/admin/AdminProfileRepair'));
const AdminScheduledJobs = lazy(() => import('./pages/admin/AdminScheduledJobs'));

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
                      <Suspense fallback={<PageLoader />}>
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
                          <Route
                            path="/catking/dashboard"
                            element={
                              <AdminRoute>
                                <AdminDashboard />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/users"
                            element={
                              <AdminRoute>
                                <AdminUsers />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/profiles"
                            element={
                              <AdminRoute>
                                <AdminProfileRepair />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/stats"
                            element={
                              <AdminRoute>
                                <AdminStatistics />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/ai-metrics"
                            element={
                              <AdminRoute>
                                <AdminAIMetrics />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/errors"
                            element={
                              <AdminRoute>
                                <AdminErrorLogs />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/moderation"
                            element={
                              <AdminRoute>
                                <AdminModeration />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/settings"
                            element={
                              <AdminRoute>
                                <AdminSettings />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/announcements"
                            element={
                              <AdminRoute>
                                <AdminAnnouncements />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/config"
                            element={
                              <AdminRoute>
                                <AdminGameConfig />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/battle-pass"
                            element={
                              <AdminRoute>
                                <AdminBattlePass />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/notifications"
                            element={
                              <AdminRoute>
                                <AdminNotifications />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/scheduled-jobs"
                            element={
                              <AdminRoute>
                                <AdminScheduledJobs />
                              </AdminRoute>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
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
