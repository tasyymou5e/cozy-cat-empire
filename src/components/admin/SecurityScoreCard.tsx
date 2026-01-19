/**
 * Security Score Card Component
 *
 * Displays the overall security grade (A-F) with visual styling
 * and breakdown of the score calculation.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { LinterResults } from '@/types/admin';

interface SecurityScoreCardProps {
  results: LinterResults | null;
  previousScore?: number | null;
  isLoading?: boolean;
}

// Calculate security score from linter results (0-100)
export function calculateSecurityScore(results: LinterResults | null): number {
  if (!results) return 100;

  // Base score starts at 100
  let score = 100;

  // Deduct points for each issue based on severity
  results.issues.forEach((issue) => {
    switch (issue.level) {
      case 'error':
        score -= 25; // Critical issues
        break;
      case 'warn':
        score -= 10; // Warnings
        break;
      case 'info':
        score -= 2; // Info items
        break;
    }
  });

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

// Get letter grade from score
export function getSecurityGrade(score: number): {
  grade: string;
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Shield;
} {
  if (score >= 90) {
    return {
      grade: 'A',
      label: 'Excellent',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      icon: ShieldCheck,
    };
  }
  if (score >= 80) {
    return {
      grade: 'B',
      label: 'Good',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      icon: Shield,
    };
  }
  if (score >= 70) {
    return {
      grade: 'C',
      label: 'Fair',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      icon: Shield,
    };
  }
  if (score >= 60) {
    return {
      grade: 'D',
      label: 'Poor',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      icon: ShieldAlert,
    };
  }
  return {
    grade: 'F',
    label: 'Critical',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    icon: ShieldX,
  };
}

export function SecurityScoreCard({ results, previousScore, isLoading }: SecurityScoreCardProps) {
  const score = calculateSecurityScore(results);
  const gradeInfo = getSecurityGrade(score);
  const GradeIcon = gradeInfo.icon;

  // Calculate trend
  const trend = previousScore !== null && previousScore !== undefined
    ? score - previousScore
    : null;

  const getTrendIcon = () => {
    if (trend === null) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (trend === null) return null;
    if (trend > 0) return <span className="text-green-500">+{trend} pts</span>;
    if (trend < 0) return <span className="text-red-500">{trend} pts</span>;
    return <span className="text-muted-foreground">No change</span>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Score
        </CardTitle>
        <CardDescription>Overall security health grade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Grade Circle */}
          <div
            className={`relative flex items-center justify-center w-24 h-24 rounded-full ${gradeInfo.bgColor}/10 border-4 ${gradeInfo.color.replace('text-', 'border-')}`}
          >
            <div className="text-center">
              <span className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
            </div>
            <GradeIcon
              className={`absolute -bottom-1 -right-1 h-8 w-8 ${gradeInfo.color} bg-background rounded-full p-1`}
            />
          </div>

          {/* Score Details */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{gradeInfo.label} Security</span>
                <span className="text-sm text-muted-foreground">{score}/100</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>

            {/* Trend */}
            {trend !== null && (
              <div className="flex items-center gap-2 text-sm">
                {getTrendIcon()}
                {getTrendText()}
                <span className="text-muted-foreground">from last scan</span>
              </div>
            )}

            {/* Issue Breakdown */}
            {results && (
              <div className="flex gap-4 text-xs">
                {results.errors > 0 && (
                  <span className="text-red-500">
                    {results.errors} critical
                  </span>
                )}
                {results.warnings > 0 && (
                  <span className="text-yellow-500">
                    {results.warnings} warning{results.warnings !== 1 ? 's' : ''}
                  </span>
                )}
                {results.infos > 0 && (
                  <span className="text-blue-500">
                    {results.infos} info
                  </span>
                )}
                {results.totalIssues === 0 && (
                  <span className="text-green-500">No issues found!</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
