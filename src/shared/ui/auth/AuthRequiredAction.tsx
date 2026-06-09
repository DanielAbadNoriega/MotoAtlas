import { useEffect, useRef, useState, type ReactNode } from 'react';
import './AuthRequiredAction.scss';

export type AuthRequiredActionProps = Readonly<{
  ariaLabel: string;
  children: ReactNode;
  className: string;
  hintId: string;
  hintMessage: string;
  isAuthenticated: boolean;
  onAction: () => void;
}>;

const HINT_VISIBILITY_MS = 4000;

export function AuthRequiredAction({
  ariaLabel,
  children,
  className,
  hintId,
  hintMessage,
  isAuthenticated,
  onAction,
}: AuthRequiredActionProps) {
  const [isHintVisible, setIsHintVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearHint = () => {
    setIsHintVisible(false);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showHint = () => {
    setIsHintVisible(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHintVisible(false);
      timeoutRef.current = null;
    }, HINT_VISIBILITY_MS);
  };

  const handleClick = () => {
    if (!isAuthenticated) {
      showHint();
      return;
    }
    clearHint();
    onAction();
  };

  const isLocked = !isAuthenticated;

  return (
    <span className={['auth-required-action', isLocked ? 'auth-required-action--locked' : ''].filter(Boolean).join(' ')}>
      <button
        aria-controls={isLocked ? hintId : undefined}
        aria-disabled={isLocked ? true : undefined}
        aria-label={ariaLabel}
        className={className}
        onClick={handleClick}
        type="button"
      >
        {children}
      </button>
      <span
        aria-live="polite"
        className={['auth-required-action__hint', isHintVisible ? 'auth-required-action__hint--visible' : ''].filter(Boolean).join(' ')}
        id={hintId}
        role={isHintVisible ? 'status' : undefined}
      >
        {hintMessage}
      </span>
    </span>
  );
}
