import type { Bike } from '../../types/bike';
import type { MotorcycleReview } from '../../services/motorcycleReviewService';
import { getMotorcycleImage } from '../images/getMotorcycleImage';
import {
  getBikeCanonicalPath,
  getBikeSeoSlug,
  getCommunityCanonicalPath,
  getCompareCanonicalPath,
  getCompareSeoSlug,
  getStaticInfoCanonicalPath,
  type StaticInfoRouteKey,
} from '../routing/routeUtils';
import { getReviewAggregate } from '../reviews/reviewUtils';

export const siteBaseUrl = 'https://motoatlas.com';
export const siteName = 'MotoAtlas';

export type SeoMetadata = Readonly<{
  canonicalUrl: string;
  description: string;
  imageUrl?: string;
  jsonLd?: unknown;
  title: string;
}>;

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${siteBaseUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

function setMeta(nameOrProperty: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${nameOrProperty}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, nameOrProperty);
    document.head.appendChild(element);
  }

  element.content = content;
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }

  element.href = url;
}

function setJsonLd(value: unknown) {
  document.head.querySelectorAll('script[data-motoatlas-jsonld="true"]').forEach((element) => element.remove());

  if (!value) {
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.motoatlasJsonld = 'true';
  script.textContent = JSON.stringify(value);
  document.head.appendChild(script);
}

export function buildBikeJsonLd(bike: Bike, reviews: readonly MotorcycleReview[] = []) {
  const aggregate = getReviewAggregate(reviews);
  const image = getMotorcycleImage(bike);

  return {
    '@context': 'https://schema.org',
    '@type': 'Motorcycle',
    brand: { '@type': 'Brand', name: bike.brand },
    description: bike.description,
    image: absoluteUrl(image.imageUrl),
    model: bike.model,
    name: `${bike.brand} ${bike.model}`,
    productionDate: String(bike.year),
    url: absoluteUrl(getBikeCanonicalPath(bike)),
    ...(aggregate.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: aggregate.averageRating,
            reviewCount: aggregate.reviewCount,
          },
          review: reviews.slice(0, 5).map((review) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: review.userName },
            datePublished: review.createdAt,
            reviewBody: review.comment,
            reviewRating: { '@type': 'Rating', bestRating: 5, ratingValue: review.rating, worstRating: 1 },
          })),
        }
      : {}),
  };
}

export function buildBikeSeoMetadata(bike: Bike, reviews: readonly MotorcycleReview[] = []): SeoMetadata {
  const image = getMotorcycleImage(bike);

  return {
    canonicalUrl: absoluteUrl(getBikeCanonicalPath(bike)),
    description: `${bike.brand} ${bike.model} ${bike.year}: ficha técnica, opiniones, pros, contras y comparativas en MotoAtlas.`,
    imageUrl: absoluteUrl(image.imageUrl),
    jsonLd: buildBikeJsonLd(bike, reviews),
    title: `${bike.brand} ${bike.model} ${bike.year} | Ficha técnica y opiniones | ${siteName}`,
  };
}

export function buildCommunitySeoMetadata(bike: Bike): SeoMetadata {
  const image = getMotorcycleImage(bike);
  const name = `${bike.brand} ${bike.model} ${bike.year}`;

  return {
    canonicalUrl: absoluteUrl(getCommunityCanonicalPath(bike)),
    description: `Opiniones reales, problemas comunes y experiencia de propietarios de ${name}.`,
    imageUrl: absoluteUrl(image.imageUrl),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      about: {
        '@type': 'Motorcycle',
        brand: { '@type': 'Brand', name: bike.brand },
        model: bike.model,
        name,
        productionDate: String(bike.year),
      },
      name: `Reviews ${name} | ${siteName}`,
      url: absoluteUrl(getCommunityCanonicalPath(bike)),
    },
    title: `Reviews ${name} | ${siteName}`,
  };
}


const staticInfoSeoContent: Record<StaticInfoRouteKey, Pick<SeoMetadata, 'description' | 'title'>> = {
  metodologia: {
    title: `Metodología | ${siteName}`,
    description: 'Cómo MotoAtlas clasifica datos técnicos, manuales, estimados, placeholder y señales de comunidad.',
  },
  'fuentes-datos': {
    title: `Fuentes de datos | ${siteName}`,
    description: 'Transparencia sobre fuentes externas, revisión manual, datos de comunidad, imágenes y ratings en MotoAtlas.',
  },
  'solicitar-modelo': {
    title: `Solicitar modelo | ${siteName}`,
    description: 'Solicita una moto que todavía no está en el catálogo técnico de MotoAtlas.',
  },
  privacidad: {
    title: `Privacidad | ${siteName}`,
    description: 'Política básica de privacidad de MotoAtlas: reviews, alias, almacenamiento local y servicios externos.',
  },
  terminos: {
    title: `Términos de uso | ${siteName}`,
    description: 'Términos básicos para utilizar MotoAtlas, sus datos técnicos, comparativas y comunidad.',
  },
};

export function buildStaticInfoSeoMetadata(routeKey: StaticInfoRouteKey): SeoMetadata {
  const content = staticInfoSeoContent[routeKey];
  const canonicalPath = getStaticInfoCanonicalPath(routeKey);

  return {
    canonicalUrl: absoluteUrl(canonicalPath),
    description: content.description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      description: content.description,
      name: content.title,
      url: absoluteUrl(canonicalPath),
    },
    title: content.title,
  };
}

export function buildTopRatedSeoMetadata(): SeoMetadata {
  return {
    canonicalUrl: absoluteUrl('/motos-mejor-valoradas'),
    description: 'Descubre las motos mejor valoradas por la comunidad MotoAtlas, con ratings, reviews, comparativas y acceso a fichas técnicas.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      description: 'Ranking de motos mejor valoradas por reviews aprobadas de la comunidad MotoAtlas.',
      name: `Motos mejor valoradas | ${siteName}`,
      url: absoluteUrl('/motos-mejor-valoradas'),
    },
    title: `Motos mejor valoradas | ${siteName}`,
  };
}

export function buildCompareSeoMetadata(bikes: readonly Bike[]): SeoMetadata {
  const names = bikes.map((bike) => `${bike.brand} ${bike.model}`);
  const title = `${names.join(' vs ')} | Comparador MotoAtlas`;
  const firstImage = bikes[0] ? getMotorcycleImage(bikes[0]).imageUrl : '/images/placeholders/motorcycle-technical-pending.jpg';

  return {
    canonicalUrl: absoluteUrl(getCompareCanonicalPath(bikes)),
    description: `Comparativa técnica ${names.join(' vs ')}: prestaciones, A2, pros, contras, fiabilidad y uso real.`,
    imageUrl: absoluteUrl(firstImage),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: bikes.map((bike, index) => ({
        '@type': 'ListItem',
        item: absoluteUrl(getBikeCanonicalPath(bike)),
        name: `${bike.brand} ${bike.model}`,
        position: index + 1,
      })),
      name: title,
      url: absoluteUrl(getCompareCanonicalPath(bikes)),
    },
    title,
  };
}

export function applySeoMetadata(metadata: SeoMetadata) {
  document.title = metadata.title;
  setMeta('description', metadata.description);
  setMeta('og:title', metadata.title, 'property');
  setMeta('og:description', metadata.description, 'property');

  if (metadata.imageUrl) {
    setMeta('og:image', metadata.imageUrl, 'property');
  }

  setCanonical(metadata.canonicalUrl);
  setJsonLd(metadata.jsonLd);
}

export function getSitemapUrls(motorcycles: readonly Bike[]) {
  const bikeUrls = motorcycles.map((bike) => absoluteUrl(getBikeCanonicalPath(bike)));
  const communityUrls = motorcycles.map((bike) => absoluteUrl(getCommunityCanonicalPath(bike)));
  const compareUrls = motorcycles.slice(0, 3).flatMap((bike, index, selectedBikes) =>
    selectedBikes.slice(index + 1).map((otherBike) => absoluteUrl(getCompareCanonicalPath([bike, otherBike]))),
  );

  return [
    siteBaseUrl,
    `${siteBaseUrl}/buscador`,
    `${siteBaseUrl}/motos-mejor-valoradas`,
    `${siteBaseUrl}/metodologia`,
    `${siteBaseUrl}/fuentes-datos`,
    `${siteBaseUrl}/solicitar-modelo`,
    `${siteBaseUrl}/privacidad`,
    `${siteBaseUrl}/terminos`,
    ...bikeUrls,
    ...communityUrls,
    ...compareUrls,
  ];
}

export function buildSitemapXml(urls: readonly string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
}

export function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\nSitemap: ${siteBaseUrl}/sitemap.xml\n`;
}

export { getBikeCanonicalPath, getBikeSeoSlug, getCommunityCanonicalPath, getCompareCanonicalPath, getCompareSeoSlug };
