import type { Report, ReportCopy } from '../types/report';

export const reports = [
  {
    id: 'yamaha-mt-07-2021-23',
    model: 'MT-07 (2021-23)',
    score: 8.4,
    warnings: ['Oxidación en colectores'],
    strengths: ['Motor indestructible'],
    reportsCount: 124,
  },
  {
    id: 'bmw-gs-1250-2019',
    model: 'GS 1250 (2019+)',
    score: 9.1,
    warnings: ['Fugas cardan (retirada)'],
    strengths: ['Confort premium'],
    reportsCount: 342,
  },
  {
    id: 'ducati-monster-821',
    model: 'Monster 821',
    score: 7.2,
    warnings: ['Calor excesivo asiento'],
    strengths: ['Chasis ágil'],
    reportsCount: 89,
  },
] satisfies readonly Report[];


export const reportCopy = {
  countLocale: 'es-ES',
  countSuffix: 'reportes',
} satisfies ReportCopy;
