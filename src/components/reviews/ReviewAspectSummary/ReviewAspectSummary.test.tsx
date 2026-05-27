import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ReviewAspectSummary } from './ReviewAspectSummary';

const engineAspectPositiveWithComment = {
  category: 'engine' as const,
  sentiment: 'positive' as const,
  comment: 'Motor muito suave e cheio de força',
};

const engineAspectNegative = {
  category: 'engine' as const,
  sentiment: 'negative' as const,
};

const ergonomicsAspectPositiveWithComment = {
  category: 'ergonomics' as const,
  sentiment: 'positive' as const,
  comment: 'Posición muy cómoda para horas de saddle',
};

const consumptionAspectNegative = {
  category: 'consumption' as const,
  sentiment: 'negative' as const,
};

describe('ReviewAspectSummary', () => {
  it('renderiza null si no hay aspects', () => {
    const { container } = render(<ReviewAspectSummary aspects={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza null si aspects está vacío', () => {
    const { container } = render(<ReviewAspectSummary aspects={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título Valoración técnica si hay aspects', () => {
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    expect(screen.getByText('Valoración técnica')).toBeInTheDocument();
  });

  it('renderiza labels correctos de categorías', () => {
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    expect(screen.getByText('Motor')).toBeInTheDocument();
  });

  it('renderiza ergonomics como Ergonomía', () => {
    render(<ReviewAspectSummary aspects={[ergonomicsAspectPositiveWithComment]} />);
    expect(screen.getByText('Ergonomía')).toBeInTheDocument();
  });

  it('muestra + para positive sentiment', () => {
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    expect(screen.getByText('+', { selector: '.review-aspect-summary__chip-sentiment--positive' })).toBeInTheDocument();
  });

  it('muestra − para negative sentiment', () => {
    render(<ReviewAspectSummary aspects={[consumptionAspectNegative]} />);
    expect(screen.getByText('−', { selector: '.review-aspect-summary__chip-sentiment--negative' })).toBeInTheDocument();
  });

  it('tooltip no existe en el DOM sin hacer click', () => {
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('click en botón abre tooltip', async () => {
    const user = userEvent.setup();
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    const btn = screen.getByRole('button', { name: /Ver matiz sobre Motor/i });
    await user.click(btn);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Motor muito suave e cheio de força');
  });

  it('click de nuevo cierra tooltip', async () => {
    const user = userEvent.setup();
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    const btn = screen.getByRole('button', { name: /Ver matiz sobre Motor/i });
    await user.click(btn);
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
    await user.click(btn);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('el botón de comentario tiene aria-label correcto', () => {
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    const btn = screen.getByRole('button', { name: /Ver matiz sobre Motor/i });
    expect(btn).toBeInTheDocument();
  });

  it('aspectos sin comment no tienen botón', () => {
    render(<ReviewAspectSummary aspects={[engineAspectNegative]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra múltiples aspectos correctamente', () => {
    render(<ReviewAspectSummary aspects={[
      engineAspectPositiveWithComment,
      ergonomicsAspectPositiveWithComment,
      consumptionAspectNegative,
    ]} />);

    expect(screen.getByText('Motor')).toBeInTheDocument();
    expect(screen.getByText('Ergonomía')).toBeInTheDocument();
    expect(screen.getByText('Consumo')).toBeInTheDocument();
  });

  it('botón tiene aria-expanded que cambia al hacer click', async () => {
    const user = userEvent.setup();
    render(<ReviewAspectSummary aspects={[engineAspectPositiveWithComment]} />);
    const btn = screen.getByRole('button', { name: /Ver matiz sobre Motor/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
