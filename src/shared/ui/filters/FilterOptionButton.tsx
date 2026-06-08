import type { ReactNode } from 'react';

export type FilterOptionButtonProps = Readonly<{
  active: boolean;
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  classPrefix: string;
  icon?: string;
  label: string;
  onClick: () => void;
}>;

export function FilterOptionButton({
  active,
  ariaLabel,
  children,
  className = '',
  classPrefix,
  icon,
  label,
  onClick,
}: FilterOptionButtonProps) {
  const baseClass = `${classPrefix}__filter-option`;
  const activeClass = `${baseClass}--active`;
  const buttonClasses = [baseClass, active ? activeClass : '', className].filter(Boolean).join(' ');

  return (
    <button className={buttonClasses} type="button" aria-label={ariaLabel} aria-pressed={active} onClick={onClick}>
      {icon ? <span className="material-symbols-outlined" aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
      {children}
    </button>
  );
}
