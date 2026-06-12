import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchControl } from './SearchControl';

describe('SearchControl', () => {
  it('renders an accessible search input by label', () => {
    render(<SearchControl id="search-control-test" label="Buscar motos" placeholder="Busca..." />);

    expect(screen.getByLabelText(/Buscar motos/i)).toHaveAttribute('type', 'search');
    expect(screen.getByPlaceholderText(/Busca/i)).toBeInTheDocument();
  });

  it('supports standard controlled input props', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <SearchControl
        id="search-control-controlled"
        label="Buscar marca"
        value="yam"
        onChange={handleChange}
      />,
    );

    const input = screen.getByLabelText(/Buscar marca/i);
    expect(input).toHaveValue('yam');

    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalled();
  });
});
