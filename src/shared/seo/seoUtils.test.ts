import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../../test/fixtures/bikes';
import {
  applySeoMetadata,
  buildAccountMotorcycleReviewsSeoMetadata,
  buildAdminSeoMetadata,
  buildBikeJsonLd,
  buildAuthSeoMetadata,
  buildBikeSeoMetadata,
  buildCommunityLandingSeoMetadata,
  buildCommunityReviewsSeoMetadata,
  buildCommunitySeoMetadata,
  buildCompareSeoMetadata,
  buildStaticInfoSeoMetadata,
  buildTopRatedSeoMetadata,
  buildRobotsTxt,
  buildSitemapXml,
  getSitemapUrls,
} from './seoUtils';

describe('seoUtils', () => {
  it('genera meta de ficha de moto con JSON-LD Motorcycle y AggregateRating', () => {
    const metadata = buildBikeSeoMetadata(bikeFixtures[0], [
      {
        id: 'review-1',
        motorcycleId: bikeFixtures[0].id,
        userName: 'Dani',
        rating: 5,
        ridingStyle: 'viaje',
        ownershipMonths: null,
        kilometers: null,
        comment: 'Muy buena.',
        pros: [],
        cons: [],
        verified: false,
        status: 'approved',
        createdAt: '2026-05-14T10:00:00.000Z',
        updatedAt: '2026-05-14T10:00:00.000Z',
      },
    ]);
    const jsonLd = metadata.jsonLd as ReturnType<typeof buildBikeJsonLd>;

    expect(metadata.title).toContain('BMW F 900 GS 2024');
    expect(metadata.canonicalUrl).toContain('/motos/bmw-f-900-gs');
    expect(jsonLd).toMatchObject({ '@type': 'Motorcycle', aggregateRating: { ratingValue: 5, reviewCount: 1 } });
  });

  it('genera meta de comparador SEO-friendly', () => {
    const metadata = buildCompareSeoMetadata(bikeFixtures.slice(0, 2));

    expect(metadata.title).toContain('BMW F 900 GS vs Aprilia Tuareg 660');
    expect(metadata.canonicalUrl).toContain('/comparador/bmw-f-900-gs-vs-aprilia-tuareg-660');
  });

  it('genera meta SEO para comunidad de una moto', () => {
    const metadata = buildCommunitySeoMetadata(bikeFixtures[0]);

    expect(metadata.title).toBe('Reviews BMW F 900 GS 2024 | MotoAtlas');
    expect(metadata.description).toContain('Opiniones reales');
    expect(metadata.canonicalUrl).toContain('/comunidad/test-bmw-f-900-gs');
    expect(metadata.jsonLd).toMatchObject({ '@type': 'CollectionPage' });
  });



  it('genera meta SEO para páginas de Datos y Legal', () => {
    expect(buildStaticInfoSeoMetadata('metodologia')).toMatchObject({
      title: 'Metodología | MotoAtlas',
      canonicalUrl: expect.stringContaining('/metodologia'),
    });
    expect(buildStaticInfoSeoMetadata('fuentes-datos').title).toBe('Fuentes de datos | MotoAtlas');
    expect(buildStaticInfoSeoMetadata('solicitar-modelo').description).toContain('Solicita una moto');
    expect(buildStaticInfoSeoMetadata('privacidad').title).toBe('Privacidad | MotoAtlas');
    expect(buildStaticInfoSeoMetadata('terminos').title).toBe('Términos de uso | MotoAtlas');
  });

  it('genera meta SEO para la landing principal de comunidad', () => {
    const metadata = buildCommunityLandingSeoMetadata();

    expect(metadata.title).toBe('Comunidad MotoAtlas | Reviews y motos mejor valoradas');
    expect(metadata.description).toContain('reviews aprobadas');
    expect(metadata.canonicalUrl).toBe('https://motoatlas.com/comunidad');
    expect(metadata.jsonLd).toMatchObject({ '@type': 'CollectionPage' });
  });

  it('genera meta SEO para el archivo público de reviews de comunidad', () => {
    const metadata = buildCommunityReviewsSeoMetadata();

    expect(metadata).toMatchObject({
      canonicalUrl: 'https://motoatlas.com/comunidad/reviews',
      description: 'Opiniones reales de propietarios, kilómetros, uso, pros y contras para ayudarte a elegir mejor tu próxima moto.',
      title: 'Reviews de la comunidad | MotoAtlas',
    });
    expect(metadata.jsonLd).toMatchObject({ '@type': 'CollectionPage' });
  });

  it('mantiene motos mejor valoradas como alias SEO de comunidad', () => {
    expect(buildTopRatedSeoMetadata()).toMatchObject(buildCommunityLandingSeoMetadata());
  });

  it('genera meta SEO para login, registro y cuenta', () => {
    expect(buildAuthSeoMetadata('login')).toMatchObject({
      title: 'Iniciar sesión | MotoAtlas',
      canonicalUrl: 'https://motoatlas.com/login',
    });
    expect(buildAuthSeoMetadata('registro').title).toBe('Crear cuenta | MotoAtlas');
    expect(buildAuthSeoMetadata('cuenta').description).toContain('Gestiona tu cuenta');
    expect(buildAuthSeoMetadata('cuenta-reviews')).toMatchObject({
      title: 'Mis reviews | MotoAtlas',
      canonicalUrl: 'https://motoatlas.com/cuenta/reviews',
      description: 'Consulta tus reviews enviadas, su estado de revisión y la experiencia registrada con cada moto.',
    });
    expect(buildAuthSeoMetadata('cuenta-solicitudes')).toMatchObject({
      title: 'Mis solicitudes | MotoAtlas',
      canonicalUrl: 'https://motoatlas.com/cuenta/solicitudes',
      description: 'Consulta las solicitudes de modelos que has enviado a MotoAtlas.',
    });
    expect(buildAccountMotorcycleReviewsSeoMetadata('test-bmw-f-900-gs')).toMatchObject({
      title: 'Mis reviews de esta moto | MotoAtlas',
      canonicalUrl: 'https://motoatlas.com/cuenta/reviews/test-bmw-f-900-gs',
      description: 'Revisa tus experiencias, valoraciones y comentarios sobre esta moto.',
    });
    expect(buildAdminSeoMetadata('admin')).toMatchObject({
      title: 'Panel admin | MotoAtlas',
      canonicalUrl: 'https://motoatlas.com/admin',
    });
    expect(buildAdminSeoMetadata('moderacion')).toMatchObject({
      title: 'Moderación | MotoAtlas',
      canonicalUrl: 'https://motoatlas.com/admin/moderacion',
      description: 'Revisa reportes de la comunidad y gestiona el estado de reviews en MotoAtlas.',
    });
  });

  it('aplica meta tags, canonical y JSON-LD al documento', () => {
    applySeoMetadata(buildCompareSeoMetadata(bikeFixtures.slice(0, 2)));

    expect(document.title).toContain('BMW F 900 GS vs Aprilia Tuareg 660');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', expect.stringContaining('Comparativa técnica'));
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute('content', expect.stringContaining('BMW F 900 GS'));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', expect.stringContaining('/comparador/'));
    expect(document.head.querySelector('script[type="application/ld+json"]')).toHaveTextContent('ItemList');
  });

  it('genera sitemap y robots básicos', () => {
    const urls = getSitemapUrls(bikeFixtures.slice(0, 2));
    const sitemap = buildSitemapXml(urls);

    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/motos/bmw-f-900-gs']));
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/comunidad']));
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/comunidad/reviews']));
    expect(urls).not.toContain('https://motoatlas.com/motos-mejor-valoradas');
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/metodologia']));
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/fuentes-datos']));
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/solicitar-modelo']));
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/privacidad']));
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/terminos']));
    expect(urls).not.toContain('https://motoatlas.com/cuenta/solicitudes');
    expect(urls).not.toContain('https://motoatlas.com/cuenta/reviews');
    expect(urls).toEqual(expect.arrayContaining(['https://motoatlas.com/comunidad/test-bmw-f-900-gs']));
    expect(sitemap).toContain('<urlset');
    expect(buildRobotsTxt()).toContain('Sitemap: https://motoatlas.com/sitemap.xml');
  });
});
