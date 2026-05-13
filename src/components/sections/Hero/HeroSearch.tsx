import type { FormEventHandler } from 'react';
import type { HeroSearchContent } from '../../../types/content';
import { Button } from '../../ui/Button';

type HeroSearchProps = {
  content: HeroSearchContent;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function HeroSearch({ content, onSubmit }: HeroSearchProps) {
  return (
    <form className="hero__search" onSubmit={onSubmit} role="search">
      <label className="hero__search-label" htmlFor="model-search">
        {content.label}
      </label>
      <div className="hero__search-field">
        <span className="material-symbols-outlined" aria-hidden="true">
          search
        </span>
        <input
          id="model-search"
          name="model-search"
          placeholder={content.placeholder}
          type="search"
        />
      </div>
      <Button type="submit" className="hero__search-button">
        {content.submitLabel}
      </Button>
    </form>
  );
}
