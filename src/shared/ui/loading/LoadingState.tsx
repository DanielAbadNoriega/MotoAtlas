import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
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
  backgroundImage?: string;
  backgroundPosition?: string;
};

function getIconPath(name: string): ReactNode {
  switch (name) {
    case 'motorcycle':
      return (
        <>
          <circle cx="7" cy="16" r="3.5" />
          <circle cx="17" cy="16" r="3.5" />
          <path d="M7 16l3-7h4l3 4h1" />
          <path d="M12 13v2" />
          <path d="M11 9l2-1" />
        </>
      );
    case 'groups':
      return (
        <>
          <circle cx="8" cy="7" r="2" />
          <path d="M4 16v-1a3 3 0 013-3h2a3 3 0 013 3v1" />
          <circle cx="16" cy="7" r="2" />
          <path d="M12 16v-1a3 3 0 013-3h2a3 3 0 013 3v1" />
        </>
      );
    case 'manage_search':
      return (
        <>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="M14.5 14.5L19 19" />
          <path d="M13 10.5H8" />
          <path d="M10.5 8v5" />
        </>
      );
    case 'compare_arrows':
      return (
        <>
          <path d="M4 12h14M14 8l4 4-4 4" />
          <path d="M20 12H6M10 8l-4 4 4 4" />
        </>
      );
    case 'sync':
      return (
        <>
          <path d="M4 12a8 8 0 018-8" />
          <path d="M20 12a8 8 0 01-8 8" />
          <path d="M12 1v3" />
          <path d="M12 20v3" />
          <path d="M8 4l4-3 4 3" />
          <path d="M16 20l-4 3-4-3" />
        </>
      );
    case 'bolt':
      return (
        <path d="M13 2.5L6.5 13h5.5l-2 8.5L17 11h-5.5l1.5-8.5z" />
      );
    default:
      return (
        <>
          <circle cx="7" cy="16" r="3.5" />
          <circle cx="17" cy="16" r="3.5" />
          <path d="M7 16l3-7h4l3 4h1" />
          <path d="M12 13v2" />
          <path d="M11 9l2-1" />
        </>
      );
  }
}

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
      <svg
        className="loading-state__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        data-testid="loading-state-icon-svg"
      >
        {getIconPath(icon)}
      </svg>
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
  backgroundImage,
  backgroundPosition = 'center',
  className = '',
  ...rest
}: LoadingStateProps) {
  const hasBackground = Boolean(backgroundImage);
  const rootClassName = [
    'loading-state',
    `loading-state--${variant}`,
    `loading-state--${size}`,
    hasBackground && 'loading-state--has-background',
    className,
  ].filter(Boolean).join(' ');

  return (
    <section
      {...rest}
      className={rootClassName}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="loading-state"
    >
      {hasBackground ? (
        <div
          className="loading-state__background"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundPosition,
          }}
        />
      ) : null}
      <div className="loading-state__content">
        {eyebrow ? <p className="loading-state__eyebrow">{eyebrow}</p> : null}
        <TechnicalLoader icon={icon} />
        <h2 className="loading-state__title">{title}</h2>
        {message ? <p className="loading-state__message">{message}</p> : null}
      </div>
    </section>
  );
}
