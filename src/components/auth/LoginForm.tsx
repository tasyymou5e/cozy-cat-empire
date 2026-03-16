import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock } from 'lucide-react';

interface LoginFormProps {
  email: string;
  password: string;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}

export function LoginForm({ email, password, isSubmitting, onEmailChange, onPasswordChange }: LoginFormProps) {
  return (
    <>
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
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={isSubmitting}
          required
          minLength={6}
          className="bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20"
        />
      </div>
    </>
  );
}
