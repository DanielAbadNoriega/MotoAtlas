import alpes from '../assets/routes/alpes(Route 1).png';
import costaBrava from '../assets/routes/costa-brava(Route 2).png';
import transPirenaica from '../assets/routes/trans-pirenaica(route-3).png';
import type { Route } from '../types/route';

export const routes: Route[] = [
  {
    id: 'paso-alpes',
    title: 'Paso de los Alpes',
    location: 'FRANCIA/ITALIA',
    distance: '420 KM',
    difficulty: 'ALTA',
    progress: 75,
    image: alpes,
    alt: 'Carretera alpina sinuosa vista desde dron entre valles y picos rocosos.',
  },
  {
    id: 'costa-brava-curve',
    title: 'Costa Brava Curve',
    location: 'ESPAÑA',
    distance: '150 KM',
    difficulty: 'MEDIA',
    progress: 50,
    image: costaBrava,
    alt: 'Ruta costera al amanecer con acantilados y mar.',
  },
  {
    id: 'trans-pyrenees-trail',
    title: 'Trans-Pyrenees Trail',
    location: 'ESPAÑA/ANDORRA',
    distance: '800 KM',
    difficulty: 'BAJA',
    progress: 100,
    image: transPirenaica,
    alt: 'Ruta de larga distancia con carretera abierta y horizonte amplio.',
  },
];
