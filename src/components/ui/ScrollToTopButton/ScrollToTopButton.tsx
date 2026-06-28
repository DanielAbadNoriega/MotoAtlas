import { useEffect, useState } from 'react';
import { MotoIcon } from '../../../shared/ui/icons/MotoIcon';
import './ScrollToTopButton.scss';

const showAfterPx = 420;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > showAfterPx);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      className="scroll-to-top"
      type="button"
      aria-label="Volver arriba"
      onClick={() => window.scrollTo({ behavior: 'smooth', left: 0, top: 0 })}
    >
      <MotoIcon name="arrow_upward" width="1.5rem" height="1.5rem" />
    </button>
  );
}
