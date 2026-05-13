import newsOne from '../assets/news/news-moto(News 1).png';
import newsTwo from '../assets/news/news-moto(News 2).png';
import newsThree from '../assets/news/news-moto(News 3).png';
import type { News } from '../types/news';

export const news: News[] = [
  {
    id: 'superbikes-electricas',
    title: 'El futuro de las superbikes eléctricas: ¿adiós a la combustión?',
    category: 'TECNOLOGÍA',
    excerpt:
      'Analizamos los nuevos motores de flujo axial que prometen revolucionar el par motor en las dos ruedas.',
    image: newsOne,
    alt: 'Prototipo de motocicleta eléctrica en laboratorio futurista.',
    featured: true,
  },
  {
    id: 'winglets-calle',
    title: 'Winglets: ¿marketing o necesidad real en calle?',
    category: 'AERODINÁMICA',
    excerpt:
      'Descubrimos cuánta carga aerodinámica generan realmente los alerones en motos de serie.',
    image: newsTwo,
    alt: 'Detalle de alerón aerodinámico en fibra de carbono.',
  },
  {
    id: 'ajuste-rebote',
    title: 'Guía definitiva de suspensiones: ajuste de rebote',
    category: 'REPASO',
    excerpt: 'Aprende a configurar tu moto para circuito sin gastar un euro en el taller.',
    image: newsThree,
    alt: 'Motorista inclinado en curva de carretera de montaña.',
  },
];
