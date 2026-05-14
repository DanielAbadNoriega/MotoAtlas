import { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { BikeDetailPage } from './components/pages/BikeDetailPage';
import { ComparatorPage } from './components/pages/ComparatorPage';
import { SearchPage } from './components/pages/SearchPage';
import { FeaturedBikes } from './components/sections/FeaturedBikes';
import { Hero } from './components/sections/Hero';
import { LatestNews } from './components/sections/LatestNews';
import { MachineDuel } from './components/sections/MachineDuel';
import { ReliabilityReports } from './components/sections/ReliabilityReports';
import { RoutesSection } from './components/sections/RoutesSection';
import { ScrollToTopButton } from './components/ui/ScrollToTopButton';
import { bikeCatalog } from './data/bikes';
import { findBikeComparisonByHash } from './data/comparisons';
import { getMotorcycles } from './services/motorcycleService';
import type { Bike } from './types/bike';
import {
  getBikeDetailIdFromRoute,
  getComparatorSelectionFromRoute,
  getCurrentAppRoute,
  isComparatorRoute,
  isSearchRoute,
} from './shared/routing/routeUtils';
import { applySeoMetadata, buildBikeSeoMetadata, buildCompareSeoMetadata } from './shared/seo/seoUtils';

const scrollToPageTop = () => {
  window.scrollTo({ left: 0, top: 0 });
};

function useAppRoute() {
  const [route, setRoute] = useState(getCurrentAppRoute);

  useEffect(() => {
    const handleRouteChange = () => setRoute(getCurrentAppRoute());

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return route;
}

function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedBikes />
      <MachineDuel />
      <LatestNews />
      <ReliabilityReports />
      <RoutesSection />
    </main>
  );
}

export function App() {
  const route = useAppRoute();
  const [motorcycles, setMotorcycles] = useState<readonly Bike[]>(bikeCatalog);
  const legacyComparison = findBikeComparisonByHash(route);
  const legacyComparisonIds = legacyComparison?.bikes.map((bike) => bike.bikeId) ?? [];
  const bikeDetailId = getBikeDetailIdFromRoute(route, motorcycles);
  const findMotorcycleById = (id: Bike['id']) => motorcycles.find((bike) => bike.id === id);
  const detailBike = bikeDetailId ? findMotorcycleById(bikeDetailId) : undefined;
  const isSearchPage = isSearchRoute(route);
  const isComparatorPage = isComparatorRoute(route) || Boolean(legacyComparison);
  const routeComparatorSelection = getComparatorSelectionFromRoute(route, motorcycles);
  const comparatorIds = legacyComparisonIds.length > 0 ? legacyComparisonIds : routeComparatorSelection.ids;
  const comparatorBikes = comparatorIds
    .map((id) => findMotorcycleById(id))
    .filter((bike): bike is Bike => Boolean(bike));
  const missingComparatorIds = comparatorIds.filter((id) => !findMotorcycleById(id));

  useEffect(() => {
    let isMounted = true;

    getMotorcycles().then((result) => {
      if (isMounted) {
        setMotorcycles(result.motorcycles);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (route.startsWith('#/') || route.startsWith('/')) {
      scrollToPageTop();
    }
  }, [route]);

  useEffect(() => {
    if (detailBike) {
      applySeoMetadata(buildBikeSeoMetadata(detailBike));
      return;
    }

    if (isComparatorPage && comparatorBikes.length >= 2) {
      applySeoMetadata(buildCompareSeoMetadata(comparatorBikes));
      return;
    }

    applySeoMetadata({
      canonicalUrl: 'https://motoatlas.com/',
      description: 'MotoAtlas: catálogo técnico de motos, fichas, comparador y reviews.',
      title: 'MotoAtlas | Catálogo técnico de motos',
    });
  }, [comparatorBikes, detailBike, isComparatorPage]);

  return (
    <div className="app">
      <Navbar />
      {isComparatorPage ? (
        <ComparatorPage
          bikes={comparatorBikes}
          ignoredBikeCount={routeComparatorSelection.ignoredIds.length}
          missingBikeCount={missingComparatorIds.length}
          motorcycles={motorcycles}
        />
      ) : bikeDetailId ? (
        <BikeDetailPage bike={detailBike} motorcycles={motorcycles} />
      ) : isSearchPage ? (
        <SearchPage motorcycles={motorcycles} routeHash={route} />
      ) : (
        <HomePage />
      )}
      <ScrollToTopButton />
      <Footer />
    </div>
  );
}
