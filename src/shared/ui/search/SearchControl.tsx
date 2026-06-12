import type { InputHTMLAttributes } from 'react';
import './SearchControl.scss';

export type SearchControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  className?: string;
  icon?: string;
  id: string;
  label: string;
};

export function SearchControl({
  className,
  icon = 'search',
  id,
  label,
  ...inputProps
}: SearchControlProps) {
  return (
    <label className={['search-control', className].filter(Boolean).join(' ')} htmlFor={id}>
      <span className="search-control__label">{label}</span>
      <span className="search-control__field">
        <span className="material-symbols-outlined search-control__icon" aria-hidden="true">
          {icon}
        </span>
        <input {...inputProps} className="search-control__input" id={id} type="search" />
      </span>
    </label>
  );
}
