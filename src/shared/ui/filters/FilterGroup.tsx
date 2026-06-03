import type { ReactNode } from 'react';
import './FilterGroup.scss';

export type FilterGroupProps = Readonly<{
  children: ReactNode;
  title: string;
  defaultOpen?: boolean;
  className?: string;
}>;

export function FilterGroup({ children, title, defaultOpen = true, className }: FilterGroupProps) {
  return (
    <details className={['filter-group', className].filter(Boolean).join(' ')} open={defaultOpen || undefined}>
      <summary className="filter-group__summary">
        <span className="filter-group__title">{title}</span>
        <span className="filter-group__icon material-symbols-outlined" aria-hidden="true">expand_more</span>
      </summary>
      <div className="filter-group__body">{children}</div>
    </details>
  );
}