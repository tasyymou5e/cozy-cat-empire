/**
 * Renders a message attachment: inline image preview for images,
 * a download chip for everything else. Signed URLs are fetched on mount.
 */
import { useEffect, useState } from 'react';
import { Paperclip, Download } from 'lucide-react';
import { isImageAttachment, signedAttachmentUrl } from '@/lib/messageAttachments';
import { cn } from '@/lib/utils';

interface MessageAttachmentProps {
  path: string;
  name?: string | null;
  type?: string | null;
  className?: string;
}

export function MessageAttachment({ path, name, type, className }: MessageAttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void signedAttachmentUrl(path).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const label = name || 'Attachment';

  if (isImageAttachment(type)) {
    return (
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className={cn('mt-2 block overflow-hidden rounded-xl border bg-muted/40', className)}
      >
        {url ? (
          <img src={url} alt={label} loading="lazy" className="max-h-64 w-full object-cover" />
        ) : (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            Loading image…
          </div>
        )}
      </a>
    );
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      download={label}
      className={cn(
        'mt-2 flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted',
        className,
      )}
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
    </a>
  );
}
