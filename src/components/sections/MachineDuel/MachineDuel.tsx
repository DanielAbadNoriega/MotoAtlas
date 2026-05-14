import type { MouseEvent } from 'react';
import { duelBikes, getBikeById } from '../../../data/bikes';
import { machineDuelContent } from '../../../data/home';
import { getComparatorHashFromBikes } from '../../../shared/routing/routeUtils';
import { Button } from '../../ui/Button';
import { ComparisonBikeCard } from '../../ui/ComparisonBikeCard';
import { SectionHeader } from '../../ui/SectionHeader';
import { VersusBadge } from '../../ui/VersusBadge';
import './MachineDuel.scss';

export function MachineDuel() {
  const detailedDuelBikes = duelBikes.map((bike) => getBikeById(bike.id));

  const openDetailedComparison = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    window.scrollTo({ left: 0, top: 0 });
    window.location.hash = getComparatorHashFromBikes(detailedDuelBikes);
  };

  return (
    <section className="machine-duel fade-in" id="comparativas" aria-labelledby="machine-duel-title">
      <div className="machine-duel__inner">
        <SectionHeader
          align="center"
          className="machine-duel__intro"
          content={machineDuelContent.header}
          size="xl"
          titleId="machine-duel-title"
        />

        <div className="machine-duel__grid">
          <ComparisonBikeCard bike={duelBikes[0]} />
          <VersusBadge label={machineDuelContent.versusLabel} />
          <ComparisonBikeCard bike={duelBikes[1]} />
        </div>

        <div className="machine-duel__actions">
          <Button variant="secondary" onClick={openDetailedComparison}>
            {machineDuelContent.actionLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
