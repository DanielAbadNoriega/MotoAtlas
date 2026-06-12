import type { FormEventHandler } from 'react';
import { SearchControl } from '../../../shared/ui/search';
import type { HeroSearchContent } from '../../../types/content';
import { Button } from '../../ui/Button';

type HeroSearchProps = {
  content: HeroSearchContent;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function HeroSearch({ content, onSubmit }: HeroSearchProps) {
  return (
    <form className="home-hero__search" onSubmit={onSubmit} role="search">
      <SearchControl
        className="home-hero__search-field"
        id="model-search"
        label={content.label}
        name="model-search"
        placeholder={content.placeholder}
      />
      <Button type="submit" className="home-hero__search-button">
        {content.submitLabel}
      </Button>
    </form>
  );
}
