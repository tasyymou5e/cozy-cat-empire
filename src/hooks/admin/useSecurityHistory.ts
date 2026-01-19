/**
 * Security History Hook
 *
 * Fetches and manages security scan history for trend analysis.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SecurityScanHistory, LinterResults, LinterIssue } from '@/types/admin';
import { calculateSecurityScore, getSecurityGrade } from '@/components/admin/SecurityScoreCard';

const HISTORY_QUERY_KEY = ['security-scan-history'];

export function useSecurityHistory() {
  const queryClient = useQueryClient();

  // Fetch scan history (last 30 scans)
  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: async (): Promise<SecurityScanHistory[]> => {
      const { data, error } = await supabase
        .from('security_scan_history')
        .select('*')
        .order('scanned_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      // Map database results to typed interface
      return (data ?? []).map((row) => ({
        id: row.id,
        scanned_at: row.scanned_at ?? new Date().toISOString(),
        scan_duration_ms: row.scan_duration_ms,
        total_issues: row.total_issues ?? 0,
        errors: row.errors ?? 0,
        warnings: row.warnings ?? 0,
        infos: row.infos ?? 0,
        security_score: row.security_score ?? 100,
        security_grade: row.security_grade ?? 'A',
        issues: (row.issues as unknown as LinterIssue[]) ?? [],
        scanned_by: row.scanned_by,
        created_at: row.created_at,
      }));
    },
  });

  // Save scan result to history
  const saveScanMutation = useMutation({
    mutationFn: async (results: LinterResults): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const score = calculateSecurityScore(results);
      const gradeInfo = getSecurityGrade(score);

      const { error } = await supabase.from('security_scan_history').insert([{
        scanned_at: results.scannedAt,
        scan_duration_ms: results.scanDurationMs,
        total_issues: results.totalIssues,
        errors: results.errors,
        warnings: results.warnings,
        infos: results.infos,
        security_score: score,
        security_grade: gradeInfo.grade,
        issues: JSON.parse(JSON.stringify(results.issues)),
        scanned_by: user?.id ?? null,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
    },
  });

  // Get the previous scan's score for trend comparison
  const previousScore = history.length > 1 ? history[1].security_score : null;

  return {
    history,
    previousScore,
    isLoading,
    error,
    saveScan: saveScanMutation.mutateAsync,
    isSaving: saveScanMutation.isPending,
  };
}
