import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TEST_MANIFEST, CATEGORY_LABELS, type TestFileEntry } from '@/test/testManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Download,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

interface TestReport {
  id: string;
  run_by: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number | null;
  results: any;
  environment: string;
  created_at: string;
}

function useTestReports() {
  return useQuery({
    queryKey: ['admin-test-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as TestReport[];
    },
  });
}

function getCategoryCounts() {
  const counts: Record<string, number> = {};
  TEST_MANIFEST.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return counts;
}

export default function AdminTestDashboard() {
  const { user } = useAuth();
  const { data: reports = [], isLoading, refetch } = useTestReports();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categoryCounts = getCategoryCounts();
  const latestReport = reports[0] || null;

  const filteredTests =
    selectedCategory === 'all'
      ? TEST_MANIFEST
      : TEST_MANIFEST.filter((t) => t.category === selectedCategory);

  const passRate = latestReport
    ? Math.round((latestReport.passed / Math.max(latestReport.total_tests, 1)) * 100)
    : null;

  const handleSaveReport = async (reportData: {
    total_tests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
    results: any;
  }) => {
    if (!user) return;
    await supabase.from('test_reports').insert({
      run_by: user.id,
      ...reportData,
      environment: 'manual',
    } as any);
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Test Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {TEST_MANIFEST.length} test files across {Object.keys(categoryCounts).length} categories
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{TEST_MANIFEST.length}</p>
                  <p className="text-sm text-muted-foreground">Test Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{latestReport?.passed ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{latestReport?.failed ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{passRate !== null ? `${passRate}%` : '—'}</p>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to Run */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">How to Run Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg p-4 font-mono text-sm text-foreground">
              <p className="text-muted-foreground mb-2"># Run all tests</p>
              <p>npx vitest run</p>
              <p className="text-muted-foreground mt-3 mb-2"># Run with coverage</p>
              <p>npx vitest run --coverage</p>
              <p className="text-muted-foreground mt-3 mb-2"># Run specific category</p>
              <p>npx vitest run src/hooks/__tests__/</p>
              <p className="text-muted-foreground mt-3 mb-2"># Watch mode</p>
              <p>npx vitest --watch</p>
            </div>
            <p className="text-sm text-muted-foreground">
              After running tests, save the JSON report via the edge function to see results here.
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="manifest">
          <TabsList>
            <TabsTrigger value="manifest">Test Manifest</TabsTrigger>
            <TabsTrigger value="history">Run History ({reports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="manifest" className="space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              >
                All ({TEST_MANIFEST.length})
              </Badge>
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {CATEGORY_LABELS[cat] || cat} ({count})
                </Badge>
              ))}
            </div>

            {/* Test File Table */}
            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">Test Name</TableHead>
                      <TableHead className="text-foreground">Category</TableHead>
                      <TableHead className="text-foreground">File Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.path}>
                        <TableCell className="font-medium text-foreground">{test.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{CATEGORY_LABELS[test.category] || test.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{test.path}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading reports...</p>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No test reports yet. Run tests and save results to see them here.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground">Date</TableHead>
                        <TableHead className="text-foreground">Total</TableHead>
                        <TableHead className="text-foreground">Passed</TableHead>
                        <TableHead className="text-foreground">Failed</TableHead>
                        <TableHead className="text-foreground">Skipped</TableHead>
                        <TableHead className="text-foreground">Duration</TableHead>
                        <TableHead className="text-foreground">Env</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="text-foreground">
                            {format(new Date(report.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="text-foreground">{report.total_tests}</TableCell>
                          <TableCell className="text-green-500 font-medium">{report.passed}</TableCell>
                          <TableCell className={report.failed > 0 ? 'text-destructive font-medium' : 'text-foreground'}>
                            {report.failed}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{report.skipped}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {report.duration_ms ? `${(report.duration_ms / 1000).toFixed(1)}s` : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.environment}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
