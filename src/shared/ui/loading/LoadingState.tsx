import { type ComponentPropsWithoutRef } from 'react';
import './LoadingState.scss';

type LoadingSkeletonPreset = 'cards' | 'list' | 'dashboard' | 'account';

type LoadingStateVariant = 'page' | 'section' | 'inline';

type LoadingStateSize = 'sm' | 'md' | 'lg';

export type LoadingStateProps = ComponentPropsWithoutRef<'section'> & {
  title: string;
  message?: string;
  eyebrow?: string;
  icon?: string;
  variant?: LoadingStateVariant;
  size?: LoadingStateSize;
  showSkeleton?: boolean;
  skeletonPreset?: LoadingSkeletonPreset;
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

function LoadingSkeletonPreview({ preset }: { preset: LoadingSkeletonPreset }) {
  return (
    <div
      className={`loading-state__skeleton loading-state__skeleton--${preset}`}
      aria-hidden="true"
      data-testid="loading-state-skeleton"
    >
      {preset === 'cards' && Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="loading-state__skeleton-card" data-testid="loading-state-skeleton-card">
          <div className="loading-state__skeleton-image" />
          <div className="loading-state__skeleton-lines">
            <span /><span /><span />
          </div>
        </div>
      ))}
      {preset === 'list' && Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="loading-state__skeleton-row" data-testid="loading-state-skeleton-row">
          <span /><span />
        </div>
      ))}
      {preset === 'dashboard' && (
        <div className="loading-state__skeleton-dashboard">
          <div className="loading-state__skeleton-block" />
          <div className="loading-state__skeleton-block" />
          <div className="loading-state__skeleton-block" />
          <div className="loading-state__skeleton-block" />
        </div>
      )}
      {preset === 'account' && (
        <div className="loading-state__skeleton-account">
          <div className="loading-state__skeleton-profile">
            <div className="loading-state__skeleton-avatar" />
            <div className="loading-state__skeleton-lines">
              <span /><span />
            </div>
          </div>
          <div className="loading-state__skeleton-card" />
          <div className="loading-state__skeleton-card" />
        </div>
      )}
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
  showSkeleton = false,
  skeletonPreset = 'cards',
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
      {showSkeleton ? <LoadingSkeletonPreview preset={skeletonPreset} /> : null}
    </section>
  );
}
