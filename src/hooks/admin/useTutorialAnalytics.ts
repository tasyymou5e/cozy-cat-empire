import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StepMetrics {
  stepIndex: number;
  stepId: string;
  viewCount: number;
  avgTimeMs: number;
  skipCount: number;
  dropOffCount: number;
}

interface TutorialMetrics {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  completionRate: number;
  avgCompletionTimeMs: number;
  stepMetrics: StepMetrics[];
  sectionJumps: { section: string; count: number }[];
  dropOffPoints: { stepIndex: number; stepId: string; count: number }[];
}

/**
 * Hook to fetch tutorial analytics data for admin dashboard
 */
export function useTutorialAnalytics() {
  return useQuery({
    queryKey: ['admin-tutorial-analytics'],
    queryFn: async (): Promise<TutorialMetrics> => {
      // Fetch all tutorial analytics data
      const { data, error } = await supabase
        .from('tutorial_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const events = data || [];

      // Calculate unique sessions
      const sessions = new Set(events.map(e => e.session_id));
      const totalSessions = sessions.size;

      // Count completed vs abandoned
      const completedSessions = events.filter(e => e.event_type === 'completed').length;
      const abandonedSessions = events.filter(e => e.event_type === 'abandoned').length;
      const completionRate = totalSessions > 0 
        ? (completedSessions / totalSessions) * 100 
        : 0;

      // Average completion time
      const completionEvents = events.filter(e => e.event_type === 'completed' && e.total_time_ms);
      const avgCompletionTimeMs = completionEvents.length > 0
        ? completionEvents.reduce((sum, e) => sum + (e.total_time_ms || 0), 0) / completionEvents.length
        : 0;

      // Step metrics
      const stepViews = events.filter(e => e.event_type === 'step_viewed');
      const stepSkips = events.filter(e => e.event_type === 'step_skipped');
      const abandonments = events.filter(e => e.event_type === 'abandoned');

      // Group views by step
      const stepMetricsMap = new Map<number, StepMetrics>();
      
      stepViews.forEach(view => {
        const idx = view.step_index ?? 0;
        const existing = stepMetricsMap.get(idx) || {
          stepIndex: idx,
          stepId: view.step_id || `step_${idx}`,
          viewCount: 0,
          avgTimeMs: 0,
          skipCount: 0,
          dropOffCount: 0,
        };
        existing.viewCount++;
        existing.avgTimeMs = (existing.avgTimeMs * (existing.viewCount - 1) + (view.time_on_step_ms || 0)) / existing.viewCount;
        stepMetricsMap.set(idx, existing);
      });

      // Add skip counts
      stepSkips.forEach(skip => {
        const fromStep = skip.from_step ?? 0;
        const toStep = skip.to_step ?? 0;
        for (let i = fromStep + 1; i < toStep; i++) {
          const existing = stepMetricsMap.get(i);
          if (existing) {
            existing.skipCount++;
          }
        }
      });

      // Add drop-off counts
      abandonments.forEach(abandon => {
        const idx = abandon.step_index ?? 0;
        const existing = stepMetricsMap.get(idx);
        if (existing) {
          existing.dropOffCount++;
        }
      });

      const stepMetrics = Array.from(stepMetricsMap.values())
        .sort((a, b) => a.stepIndex - b.stepIndex);

      // Section jumps
      const sectionJumpEvents = events.filter(e => e.event_type === 'section_jumped');
      const sectionJumpCounts = new Map<string, number>();
      sectionJumpEvents.forEach(jump => {
        const section = jump.section || 'unknown';
        sectionJumpCounts.set(section, (sectionJumpCounts.get(section) || 0) + 1);
      });
      const sectionJumps = Array.from(sectionJumpCounts.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count);

      // Drop-off points (top 5)
      const dropOffPoints = abandonments
        .reduce((acc, a) => {
          const key = `${a.step_index}-${a.step_id}`;
          const existing = acc.find(x => x.key === key);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ 
              key, 
              stepIndex: a.step_index ?? 0, 
              stepId: a.step_id || 'unknown', 
              count: 1 
            });
          }
          return acc;
        }, [] as { key: string; stepIndex: number; stepId: string; count: number }[])
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(({ stepIndex, stepId, count }) => ({ stepIndex, stepId, count }));

      return {
        totalSessions,
        completedSessions,
        abandonedSessions,
        completionRate,
        avgCompletionTimeMs,
        stepMetrics,
        sectionJumps,
        dropOffPoints,
      };
    },
    staleTime: 60000,
  });
}

/**
 * Hook to fetch tutorial analytics trends over time
 */
export function useTutorialAnalyticsTrends(days = 14) {
  return useQuery({
    queryKey: ['admin-tutorial-trends', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('tutorial_analytics')
        .select('created_at, event_type, session_id')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData = new Map<string, { 
        date: string; 
        sessions: Set<string>; 
        completed: number; 
        abandoned: number; 
      }>();

      // Initialize all days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData.set(dateKey, { 
          date: dateKey, 
          sessions: new Set(), 
          completed: 0, 
          abandoned: 0 
        });
      }

      (data || []).forEach(row => {
        if (!row.created_at) return;
        const dateKey = row.created_at.split('T')[0];
        const dayData = dailyData.get(dateKey);
        if (dayData) {
          dayData.sessions.add(row.session_id);
          if (row.event_type === 'completed') dayData.completed++;
          if (row.event_type === 'abandoned') dayData.abandoned++;
        }
      });

      return Array.from(dailyData.values()).map(day => ({
        date: day.date,
        displayDate: new Date(day.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        sessions: day.sessions.size,
        completed: day.completed,
        abandoned: day.abandoned,
        completionRate: day.sessions.size > 0 
          ? Math.round((day.completed / day.sessions.size) * 100) 
          : 0,
      }));
    },
    staleTime: 60000,
  });
}
