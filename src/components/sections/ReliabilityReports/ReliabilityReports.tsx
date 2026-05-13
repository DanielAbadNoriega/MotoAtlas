import { reports } from '../../../data/reports';
import { Button } from '../../ui/Button';
import { ReportCard } from '../../ui/ReportCard';
import './ReliabilityReports.scss';

export function ReliabilityReports() {
  return (
    <section className="reliability-reports fade-in" aria-labelledby="reliability-reports-title">
      <div className="reliability-reports__inner">
        <header className="reliability-reports__header">
          <span className="material-symbols-outlined" aria-hidden="true">
            fact_check
          </span>
          <h2 className="section-title" id="reliability-reports-title">
            Informe de fiabilidad
          </h2>
        </header>

        <div className="reliability-reports__grid">
          {reports.map((report) => (
            <ReportCard report={report} key={report.id} />
          ))}

          <article className="reliability-reports__cta">
            <p>¿Tenés problemas técnicos?</p>
            <Button>Enviar reporte</Button>
          </article>
        </div>
      </div>
    </section>
  );
}
