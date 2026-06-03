import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FilterGroup } from './FilterGroup';

describe('FilterGroup', () => {
  it('renders title', () => {
    render(<FilterGroup title="Segmento">content</FilterGroup>);
    expect(screen.getByText('Segmento')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<FilterGroup title="Test">child content</FilterGroup>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('defaultOpen starts expanded', () => {
    render(<FilterGroup title="Test" defaultOpen={true}>body</FilterGroup>);
    expect(screen.getByRole('group')).toHaveAttribute('open');
  });

  it('defaultOpen={false} starts collapsed', () => {
    render(<FilterGroup title="Test" defaultOpen={false}>body</FilterGroup>);
    expect(screen.getByRole('group')).not.toHaveAttribute('open');
  });

  it('icon has Material Symbols class', () => {
    render(<FilterGroup title="Test">body</FilterGroup>);
    const icon = screen.getByText('expand_more');
    expect(icon).toHaveClass('material-symbols-outlined');
  });
});