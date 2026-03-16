import { Suspense } from 'react';
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
import { lazyWithRetry } from './lib/lazyWithRetry';

// Page loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <span className="text-6xl animate-bounce inline-block">🐱</span>
      <p className="mt-4 text-xl text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load all page components with retry logic for chunk load resilience
const Index = lazyWithRetry(() => import('./pages/Index'));
const CatCollection = lazyWithRetry(() => import('./pages/CatCollection'));
const CatCustomization = lazyWithRetry(() => import('./pages/CatCustomization'));
const CatPhotoBooth = lazyWithRetry(() => import('./pages/CatPhotoBooth'));
const CatGallery = lazyWithRetry(() => import('./pages/CatGallery'));
const CatRelationships = lazyWithRetry(() => import('./pages/CatRelationships'));
const Leaderboard = lazyWithRetry(() => import('./pages/Leaderboard'));
const Stats = lazyWithRetry(() => import('./pages/Stats'));
const Empire = lazyWithRetry(() => import('./pages/Empire'));
const Auth = lazyWithRetry(() => import('./pages/Auth'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

// Admin pages - lazy loaded with retry
const AdminAuth = lazyWithRetry(() => import('./pages/AdminAuth'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazyWithRetry(() => import('./pages/admin/AdminUsers'));
const AdminStatistics = lazyWithRetry(() => import('./pages/admin/AdminStatistics'));
const AdminTutorialAnalytics = lazyWithRetry(() => import('./pages/admin/AdminTutorialAnalytics'));
const AdminErrorLogs = lazyWithRetry(() => import('./pages/admin/AdminErrorLogs'));
const AdminModeration = lazyWithRetry(() => import('./pages/admin/AdminModeration'));
const AdminSettings = lazyWithRetry(() => import('./pages/admin/AdminSettings'));
const AdminAnnouncements = lazyWithRetry(() => import('./pages/admin/AdminAnnouncements'));
const AdminAIMetrics = lazyWithRetry(() => import('./pages/admin/AdminAIMetrics'));
const AdminGameConfig = lazyWithRetry(() => import('./pages/admin/AdminGameConfig'));
const AdminBattlePass = lazyWithRetry(() => import('./pages/admin/AdminBattlePass'));
const AdminNotifications = lazyWithRetry(() => import('./pages/admin/AdminNotifications'));
const AdminProfileRepair = lazyWithRetry(() => import('./pages/admin/AdminProfileRepair'));
const AdminScheduledJobs = lazyWithRetry(() => import('./pages/admin/AdminScheduledJobs'));
const AdminSecurity = lazyWithRetry(() => import('./pages/admin/AdminSecurity'));
const AdminGameSaveRepair = lazyWithRetry(() => import('./pages/admin/AdminGameSaveRepair'));
const AdminSaveRecovery = lazyWithRetry(() => import('./pages/admin/AdminSaveRecovery'));
const AdminDocs = lazyWithRetry(() => import('./pages/admin/AdminDocs'));
const AdminWinstonLogs = lazyWithRetry(() => import('./pages/admin/AdminWinstonLogs'));

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
                          <Route path="/empire" element={<Empire />} />
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
                            path="/catking/tutorial"
                            element={
                              <AdminRoute>
                                <AdminTutorialAnalytics />
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
                          <Route
                            path="/catking/security"
                            element={
                              <AdminRoute>
                                <AdminSecurity />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/game-repair"
                            element={
                              <AdminRoute>
                                <AdminGameSaveRepair />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/save-recovery"
                            element={
                              <AdminRoute>
                                <AdminSaveRecovery />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/docs"
                            element={
                              <AdminRoute>
                                <AdminDocs />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/catking/winston"
                            element={
                              <AdminRoute>
                                <AdminWinstonLogs />
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
