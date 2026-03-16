import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
}

export function ForgotPasswordForm({ email, isSubmitting, onEmailChange }: ForgotPasswordFormProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        Email
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={isSubmitting}
        required
        className="bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20"
      />
    </div>
  );
}
