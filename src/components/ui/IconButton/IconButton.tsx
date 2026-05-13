import type { ButtonHTMLAttributes } from 'react';
import type { MaterialIconName } from '../../../types/content';
import './IconButton.scss';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  icon: MaterialIconName;
  label: string;
};

export function IconButton({ icon, label, className = '', type = 'button', ...props }: IconButtonProps) {
  const classes = ['icon-button', className].filter(Boolean).join(' ');

  return (
    <button aria-label={label} className={classes} type={type} {...props}>
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
