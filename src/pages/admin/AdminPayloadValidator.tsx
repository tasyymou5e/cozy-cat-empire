/**
 * @fileoverview Admin payload validator — paste a telemetry RPC payload and see
 * which fields are required, allowed, or malformed, with a fix for each problem.
 *
 * Validation mirrors the database's SECURITY DEFINER rules (see
 * `src/lib/telemetryPayloadSchema.ts`) so the verdict shown here matches what
 * the server would raise. Optionally the payload can be sent for real to
 * confirm the RPC accepts it.
 */

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2, XCircle, AlertTriangle, MinusCircle, Copy, Send, Wand2, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  TELEMETRY_RPC_SPECS, validateTelemetryPayload,
  type TelemetryRpcName, type FieldStatus, type ValidationReport,
} from '@/lib/telemetryPayloadSchema';

const STATUS_META: Record<FieldStatus, { label: string; icon: typeof CheckCircle2; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ok: { label: 'Valid', icon: CheckCircle2, variant: 'default' },
  missing: { label: 'Missing (required)', icon: XCircle, variant: 'destructive' },
  malformed: { label: 'Malformed', icon: AlertTriangle, variant: 'destructive' },
  omitted: { label: 'Not sent (optional)', icon: MinusCircle, variant: 'outline' },
};

export default function AdminPayloadValidator() {
  const [rpc, setRpc] = useState<TelemetryRpcName>('log_auth_attempt_secure');
  const [text, setText] = useState(() =>
    JSON.stringify(TELEMETRY_RPC_SPECS.log_auth_attempt_secure.samplePayload, null, 2)
  );
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [serverResult, setServerResult] = useState<string | null>(null);

  const spec = TELEMETRY_RPC_SPECS[rpc];

  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(text);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { ok: false as const, error: 'The payload must be a JSON object, e.g. { "_email": "..." }.' };
      }
      return { ok: true as const, value: value as Record<string, unknown> };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [text]);

  const handleRpcChange = (next: string) => {
    const name = next as TelemetryRpcName;
    setRpc(name);
    setText(JSON.stringify(TELEMETRY_RPC_SPECS[name].samplePayload, null, 2));
    setReport(null);
    setParseError(null);
    setServerResult(null);
  };

  const validate = () => {
    setServerResult(null);
    if (!parsed.ok) {
      setParseError(parsed.error);
      setReport(null);
      return;
    }
    setParseError(null);
    setReport(validateTelemetryPayload(rpc, parsed.value));
  };

  const applySuggestion = () => {
    if (!report) return;
    setText(JSON.stringify(report.suggestedPayload, null, 2));
    setReport(validateTelemetryPayload(rpc, report.suggestedPayload));
    toast.success('Suggested payload applied');
  };

  const copySuggestion = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(JSON.stringify(report.suggestedPayload, null, 2));
    toast.success('Copied to clipboard');
  };

  const sendForReal = async () => {
    if (!parsed.ok) return;
    setSending(true);
    setServerResult(null);
    const { error } = await supabase.rpc(rpc as never, parsed.value as never);
    setSending(false);
    if (error) {
      setServerResult(`Rejected — ${error.message}`);
      toast.error('The server rejected this payload');
    } else {
      setServerResult('Accepted — the record was stored.');
      toast.success('Payload accepted and stored');
    }
  };

  const counts = report
    ? {
        ok: report.fields.filter((f) => f.status === 'ok').length,
        problems: report.fields.filter((f) => f.status === 'missing' || f.status === 'malformed').length,
        extras: report.extras.length,
      }
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Payload Validator
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste a telemetry payload to see which fields are required, which are accepted,
            and exactly what to change when something is wrong.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Record type</Label>
                <Select value={rpc} onValueChange={handleRpcChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(TELEMETRY_RPC_SPECS).map((s) => (
                      <SelectItem key={s.rpc} value={s.rpc}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{spec.description}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payload">JSON payload</Label>
                <Textarea
                  id="payload"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  spellCheck={false}
                  className="font-mono text-xs min-h-[260px]"
                />
                {parseError && (
                  <p className="text-xs text-destructive">Could not read the JSON: {parseError}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={validate}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Check payload
                </Button>
                <Button variant="outline" onClick={applySuggestion} disabled={!report || report.valid}>
                  <Wand2 className="h-4 w-4 mr-1" /> Apply fixes
                </Button>
                <Button variant="outline" onClick={copySuggestion} disabled={!report}>
                  <Copy className="h-4 w-4 mr-1" /> Copy fixed JSON
                </Button>
                <Button
                  variant="secondary"
                  onClick={sendForReal}
                  disabled={sending || !parsed.ok}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {sending ? 'Sending…' : 'Send for real'}
                </Button>
              </div>

              {serverResult && (
                <div
                  className={`text-sm rounded-md border p-3 ${
                    serverResult.startsWith('Accepted')
                      ? 'border-primary/40 text-foreground'
                      : 'border-destructive/50 text-destructive'
                  }`}
                >
                  {serverResult}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Result</span>
                {report && (
                  <Badge variant={report.valid ? 'default' : 'destructive'}>
                    {report.valid ? 'Payload looks valid' : `${counts?.problems ?? 0} problem(s)`}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!report ? (
                <p className="text-sm text-muted-foreground">
                  Choose a record type, paste your payload and press “Check payload”.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{counts?.ok} valid</Badge>
                    <Badge variant="outline">{counts?.problems} to fix</Badge>
                    <Badge variant="outline">{counts?.extras} unexpected</Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>What to do</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.fields.map(({ field, status, valuePreview, problem, fix, serverMessage }) => {
                          const meta = STATUS_META[status];
                          const Icon = meta.icon;
                          return (
                            <TableRow key={field.name}>
                              <TableCell className="align-top">
                                <div className="font-mono text-xs">{field.name}</div>
                                <div className="text-[11px] text-muted-foreground">
                                  {field.required ? 'Required' : 'Optional'} · {field.kind}
                                  {field.maxLength ? ` · max ${field.maxLength}` : ''}
                                </div>
                                {field.allowedValues && (
                                  <div className="text-[11px] text-muted-foreground mt-1">
                                    Allowed: {field.allowedValues.join(', ')}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant={meta.variant} className="whitespace-nowrap">
                                  <Icon className="h-3 w-3 mr-1" />
                                  {meta.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top font-mono text-[11px] max-w-[160px] break-words">
                                {valuePreview}
                              </TableCell>
                              <TableCell className="align-top text-xs space-y-1 max-w-[260px]">
                                {problem ? (
                                  <>
                                    <div>{problem}</div>
                                    <div className="text-primary">{fix}</div>
                                    {serverMessage && (
                                      <div className="text-[11px] text-muted-foreground font-mono">
                                        Server would say: {serverMessage}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">{field.description}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {report.extras.map((extra) => (
                          <TableRow key={extra.name}>
                            <TableCell className="align-top font-mono text-xs">{extra.name}</TableCell>
                            <TableCell className="align-top">
                              <Badge variant="secondary" className="whitespace-nowrap">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Not allowed
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top font-mono text-[11px] max-w-[160px] break-words">
                              {extra.valuePreview}
                            </TableCell>
                            <TableCell className="align-top text-xs text-primary max-w-[260px]">
                              {extra.fix}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-2">
                    <Label>Suggested payload</Label>
                    <pre className="text-[11px] font-mono bg-muted/50 rounded-md p-3 overflow-x-auto">
                      {JSON.stringify(report.suggestedPayload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
