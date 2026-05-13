import type { ReportCtaContent } from '../../../types/content';
import { Button } from '../Button';
import './ReportCtaCard.scss';

type ReportCtaCardProps = {
  content: ReportCtaContent;
};

export function ReportCtaCard({ content }: ReportCtaCardProps) {
  return (
    <article className="report-cta-card">
      <p>{content.title}</p>
      <Button>{content.actionLabel}</Button>
    </article>
  );
}
