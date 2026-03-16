import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

interface UpdatePasswordFormProps {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
}

export function UpdatePasswordForm({
  password,
  confirmPassword,
  isSubmitting,
  onPasswordChange,
  onConfirmPasswordChange,
}: UpdatePasswordFormProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          New Password
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
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          disabled={isSubmitting}
          required
          minLength={6}
          className="bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20"
        />
      </div>
    </>
  );
}
