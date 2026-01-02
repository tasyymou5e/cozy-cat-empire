import { cn } from '@/lib/utils';

interface MessageBarProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function MessageBar({ message, type }: MessageBarProps) {
  return (
    <div className={cn(
      'message-bar',
      type === 'success' && 'message-success',
      type === 'warning' && 'message-warning',
      type === 'error' && 'message-error',
    )}>
      <p className="text-center font-medium">{message}</p>
    </div>
  );
}
