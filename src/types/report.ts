export type Report = Readonly<{
  id: string;
  model: string;
  score: number;
  warnings: readonly string[];
  strengths: readonly string[];
  reportsCount: number;
}>;


export type ReportCopy = Readonly<{
  countLocale: string;
  countSuffix: string;
}>;
