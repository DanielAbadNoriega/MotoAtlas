import type { Report } from '../../../types/report';
import './ReportCard.scss';

type ReportCardProps = {
  report: Report;
};

export function ReportCard({ report }: ReportCardProps) {
  return (
    <article className="report-card">
      <div className="report-card__topline">
        <span>{report.model}</span>
        <strong>{report.score.toFixed(1)}</strong>
      </div>

      <div className="report-card__checks">
        {report.warnings.map((warning) => (
          <p className="report-card__check report-card__check--warning" key={warning}>
            <span className="material-symbols-outlined" aria-hidden="true">
              warning
            </span>
            {warning}
          </p>
        ))}

        {report.strengths.map((strength) => (
          <p className="report-card__check" key={strength}>
            <span className="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
            {strength}
          </p>
        ))}
      </div>

      <div className="report-card__footer">
        <span>{report.reportsCount.toLocaleString('es-ES')} reportes</span>
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_forward
        </span>
      </div>
    </article>
  );
}
