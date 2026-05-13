import { duelBikes } from '../../../data/bikes';
import { defaultBikeComparison } from '../../../data/comparisons';
import { machineDuelContent } from '../../../data/home';
import { Button } from '../../ui/Button';
import { ComparisonBikeCard } from '../../ui/ComparisonBikeCard';
import { SectionHeader } from '../../ui/SectionHeader';
import { VersusBadge } from '../../ui/VersusBadge';
import './MachineDuel.scss';

export function MachineDuel() {
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
          <Button variant="secondary" onClick={() => { window.location.hash = defaultBikeComparison.routeHash; }}>
            {machineDuelContent.actionLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
