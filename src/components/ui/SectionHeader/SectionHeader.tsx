import type { ButtonVariant } from '../Button';
import { Button } from '../Button';
import type { MaterialIconName, SectionHeaderContent } from '../../../types/content';
import './SectionHeader.scss';

type SectionHeaderProps = {
  content: SectionHeaderContent;
  titleId: string;
  actionVariant?: ButtonVariant;
  align?: 'start' | 'center';
  className?: string;
  icon?: MaterialIconName;
  size?: 'lg' | 'xl';
};

export function SectionHeader({
  content,
  titleId,
  actionVariant = 'ghost',
  align = 'start',
  className = '',
  icon,
  size = 'lg',
}: SectionHeaderProps) {
  const classes = [
    'section-header',
    `section-header--${align}`,
    `section-header--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      <div className="section-header__title-group">
        {icon ? (
          <span className="material-symbols-outlined section-header__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <div>
          {content.kicker ? <span className="section-header__kicker">{content.kicker}</span> : null}
          <h2 className="section-header__title" id={titleId}>
            {content.title}
          </h2>
          {content.description ? <p className="section-header__description">{content.description}</p> : null}
        </div>
      </div>

      {content.actionLabel ? <Button variant={actionVariant}>{content.actionLabel}</Button> : null}
    </header>
  );
}
