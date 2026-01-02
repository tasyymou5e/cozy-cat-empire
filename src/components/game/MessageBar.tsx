interface MessageBarProps {
  message: string;
}

export function MessageBar({ message }: MessageBarProps) {
  return (
    <div className="message-bar">
      <p className="text-center font-medium">{message}</p>
    </div>
  );
}
