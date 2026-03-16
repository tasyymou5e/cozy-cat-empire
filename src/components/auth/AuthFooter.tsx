import { AuthMode } from './types';

interface AuthFooterProps {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
}

export function AuthFooter({ mode, onSwitchMode }: AuthFooterProps) {
  return (
    <div className="mt-5 text-center text-sm space-y-2">
      {mode === 'login' && (
        <>
          <button
            type="button"
            onClick={() => onSwitchMode('forgot-password')}
            className="text-muted-foreground hover:text-primary hover:underline block w-full transition-colors"
          >
            Forgot your password?
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('signup')}
            className="text-primary hover:underline transition-colors font-medium"
          >
            Don't have an account? Sign up
          </button>
        </>
      )}
      {mode === 'signup' && (
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-primary hover:underline transition-colors font-medium"
        >
          Already have an account? Log in
        </button>
      )}
      {(mode === 'forgot-password' || mode === 'update-password') && (
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-primary hover:underline transition-colors font-medium"
        >
          Back to login
        </button>
      )}
    </div>
  );
}
