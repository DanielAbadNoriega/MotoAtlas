import { homeSections, reportCta } from '../../../data/home';
import { reportCopy, reports } from '../../../data/reports';
import { ReportCard } from '../../ui/ReportCard';
import { ReportCtaCard } from '../../ui/ReportCtaCard';
import { SectionHeader } from '../../ui/SectionHeader';
import './ReliabilityReports.scss';

export function ReliabilityReports() {
  return (
    <section className="reliability-reports fade-in" aria-labelledby="reliability-reports-title">
      <div className="reliability-reports__inner">
        <SectionHeader
          className="reliability-reports__header"
          content={homeSections.reliabilityReports}
          icon="fact_check"
          titleId="reliability-reports-title"
        />

        <div className="reliability-reports__grid">
          {reports.map((report) => (
            <ReportCard copy={reportCopy} report={report} key={report.id} />
          ))}

          <ReportCtaCard content={reportCta} />
        </div>
      </div>
    </section>
  );
}
