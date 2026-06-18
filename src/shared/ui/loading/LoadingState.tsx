import { type ComponentPropsWithoutRef } from 'react';
import './LoadingState.scss';

type LoadingStateVariant = 'page' | 'section' | 'inline';

type LoadingStateSize = 'sm' | 'md' | 'lg';

export type LoadingStateProps = ComponentPropsWithoutRef<'section'> & {
  title: string;
  message?: string;
  eyebrow?: string;
  icon?: string;
  variant?: LoadingStateVariant;
  size?: LoadingStateSize;
};

function TechnicalLoader({ icon = 'motorcycle' }: { icon?: string }) {
  return (
    <div className="loading-state__loader" aria-hidden="true" data-testid="loading-state-loader">
      <svg
        className="loading-state__ring-outer"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        focusable="false"
        data-testid="loading-state-ring-outer"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeDasharray="10 20" strokeWidth="2" />
        <circle cx="50" cy="50" r="35" opacity="0.5" stroke="currentColor" strokeDasharray="5 15" strokeWidth="1" />
      </svg>
      <svg
        className="loading-state__arc"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        focusable="false"
        data-testid="loading-state-arc"
      >
        <path d="M 50 5 A 45 45 0 0 1 95 50" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
      <span className="material-symbols-outlined loading-state__icon" aria-hidden="true">{icon}</span>
    </div>
  );
}

export function LoadingState({
  title,
  message,
  eyebrow,
  icon = 'motorcycle',
  variant = 'page',
  size = 'md',
  className = '',
  ...rest
}: LoadingStateProps) {
  const rootClassName = [
    'loading-state',
    `loading-state--${variant}`,
    `loading-state--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <section
      className={rootClassName}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="loading-state"
      {...rest}
    >
      <div className="loading-state__content">
        {eyebrow ? <p className="loading-state__eyebrow">{eyebrow}</p> : null}
        <TechnicalLoader icon={icon} />
        <h2 className="loading-state__title">{title}</h2>
        {message ? <p className="loading-state__message">{message}</p> : null}
      </div>
    </section>
  );
}
