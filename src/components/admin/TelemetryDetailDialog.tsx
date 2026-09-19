/**
 * @fileoverview Drilldown dialog showing the exact request and response of a
 * telemetry RPC call so admins can spot malformed payloads.
 *
 * @module components/admin/TelemetryDetailDialog
 */

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

export interface TelemetryDetail {
  title: string;
  subtitle?: string;
  rpc: string;
  outcome: 'accepted' | 'rejected';
  httpStatus: number;
  categoryLabel?: string;
  friendly?: string;
  rawServerMessage?: string | null;
  requestJson: string;
  responseJson: string;
}

function JsonBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{label}</h4>
        <Button size="sm" variant="ghost" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="ml-1 text-xs">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
        {value}
      </pre>
    </div>
  );
}

export function TelemetryDetailDialog({
  detail,
  onClose,
}: {
  detail: TelemetryDetail | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!detail} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        {detail && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {detail.title}
                {detail.outcome === 'accepted' ? (
                  <Badge className="bg-green-600">HTTP {detail.httpStatus}</Badge>
                ) : (
                  <Badge variant="destructive">HTTP {detail.httpStatus}</Badge>
                )}
                {detail.categoryLabel && (
                  <Badge variant="outline">{detail.categoryLabel}</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="space-y-1">
                <span className="block font-mono text-xs">{detail.rpc}</span>
                {detail.subtitle && <span className="block">{detail.subtitle}</span>}
                {detail.friendly && <span className="block">{detail.friendly}</span>}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <JsonBlock label="Request payload" value={detail.requestJson} />
              <JsonBlock label="Server response" value={detail.responseJson} />
              {detail.rawServerMessage && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Raw server message</h4>
                  <p className="font-mono text-xs text-muted-foreground break-words">
                    {detail.rawServerMessage}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
