import type { BikeComparison } from '../types/comparison';

export const bikeComparisons = [
  {
    id: 'bmw-f-900-gs-vs-aprilia-tuareg-660',
    routeHash: '#/comparativas/bmw-f-900-gs-vs-aprilia-tuareg-660',
    title: 'BMW F900GS vs Aprilia Tuareg 660',
    subtitle: 'Dos trail medias con enfoques muy distintos: viaje, campo y uso real.',
    bikes: [
      {
        bikeId: 'bmw-f-900-gs-2024',
        tagline: 'Deutschland Precision',
        position: 'left',
      },
      {
        bikeId: 'aprilia-tuareg-660-2024',
        tagline: 'Italian Soul',
        position: 'right',
      },
    ],
    voteSummary: {
      leftPercent: 54,
      rightPercent: 46,
      totalVotes: 4285,
      marginOfErrorPercent: 1.2,
      topComment:
        'La BMW es un tanque imparable en carretera, pero la Aprilia te hace sentir como un piloto de rally en cuanto pisas tierra.',
      topCommentAuthor: '@RIDER_DELTA7',
    },
    verdicts: [
      {
        id: 'best-touring',
        icon: 'travel_explore',
        title: 'Mejor para viajar',
        description:
          'La protección aerodinámica, el par y el confort general de la BMW pesan más en tiradas largas.',
        winnerBikeId: 'bmw-f-900-gs-2024',
      },
      {
        id: 'best-offroad',
        icon: 'terrain',
        title: 'Mejor para offroad',
        description:
          'La ligereza, suspensiones y reparto de pesos hacen de la italiana la opción más natural fuera del asfalto.',
        winnerBikeId: 'aprilia-tuareg-660-2024',
      },
      {
        id: 'best-value',
        icon: 'payments',
        title: 'Mejor calidad/precio',
        description:
          'Con buen equipamiento y un precio más contenido, la Aprilia ofrece una propuesta muy competitiva.',
        winnerBikeId: 'aprilia-tuareg-660-2024',
      },
    ],
    scores: [
      { id: 'touring', label: 'Road Comfort', leftScore: 8.5, rightScore: 7 },
      { id: 'offroad', label: 'Off-Road Capability', leftScore: 8, rightScore: 9.5 },
      { id: 'passenger', label: 'Passenger / Load', leftScore: 7.5, rightScore: 6 },
      { id: 'fun-factor', label: 'Fun Factor', leftScore: 8, rightScore: 9 },
    ],
    reports: [
      {
        id: 'heat-right-leg',
        icon: 'thermostat',
        severity: 'ALTA',
        title: 'Calor en pierna derecha',
        description: 'Reportado en BMW F900GS. El escape calienta en exceso en tráfico lento.',
        reportCount: 124,
      },
      {
        id: 'helmet-turbulence',
        icon: 'air',
        severity: 'MEDIA',
        title: 'Turbulencias en casco',
        description: 'Reportado en Aprilia Tuareg. Cúpula original justa para pilotos de más de 1,80 m.',
        reportCount: 89,
      },
      {
        id: 'seat-hardness',
        icon: 'chair_alt',
        severity: 'BAJA',
        title: 'Dureza del asiento',
        description: 'Reportado en ambas. Fatiga notable tras rutas continuas de más de 200 km.',
        reportCount: 215,
      },
    ],
    videos: [
      {
        id: 'f900gs-review',
        title: 'BMW F900GS: ¿la nueva reina del segmento medio?',
        duration: '15:24',
        imageUrl: 'https://images.unsplash.com/photo-1544654803-b69110bb2183?q=80&w=600',
        alt: 'BMW F900GS atravesando agua en una prueba dinámica.',
      },
      {
        id: 'tuareg-10000km',
        title: 'Aprilia Tuareg 660 tras 10.000 km: lo bueno y lo malo.',
        duration: '22:10',
        imageUrl: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?q=80&w=600',
        alt: 'Aprilia Tuareg 660 saltando en terreno desértico.',
      },
      {
        id: 'trail-comparison',
        title: 'Comparativa trail 2024: ¿F900GS o Tuareg 660?',
        duration: '18:45',
        imageUrl: 'https://images.unsplash.com/photo-1558979158-65a1eaa08691?q=80&w=600',
        alt: 'Dos motos trail aparcadas en un puerto de montaña.',
      },
      {
        id: 'reliability-workshop',
        title: 'Mantenimiento y fiabilidad: lo que dice el taller.',
        duration: '12:30',
        imageUrl: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=600',
        alt: 'Mecánico revisando el motor bicilíndrico de una moto trail.',
      },
    ],
  },
] satisfies readonly [BikeComparison, ...BikeComparison[]];

export const defaultBikeComparison = bikeComparisons[0];

export function findBikeComparisonByHash(hash: string) {
  return bikeComparisons.find((comparison) => comparison.routeHash === hash);
}
