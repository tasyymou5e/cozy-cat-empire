import { AuthMode } from './types';

interface AuthFooterProps {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
}

export function AuthFooter({ mode, onSwitchMode }: AuthFooterProps) {
  return (
    <div className="mt-5 text-center text-sm space-y-2">
      <div className="auth-divider" />
      {mode === 'login' && (
        <>
          <button
            type="button"
            onClick={() => onSwitchMode('forgot-password')}
            className="story-link text-muted-foreground hover:text-primary block w-full transition-colors"
          >
            Forgot your password?
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('signup')}
            className="story-link text-primary transition-colors font-medium"
          >
            Don't have an account? Sign up
          </button>
        </>
      )}
      {mode === 'signup' && (
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="story-link text-primary transition-colors font-medium"
        >
          Already have an account? Log in
        </button>
      )}
      {(mode === 'forgot-password' || mode === 'update-password') && (
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="story-link text-primary transition-colors font-medium"
        >
          Back to login
        </button>
      )}
    </div>
  );
}
