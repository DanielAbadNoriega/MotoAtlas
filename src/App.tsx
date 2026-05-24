import { useEffect, useState } from 'react';
import { AuthProvider } from './features/auth';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { AccountPage } from './components/pages/AccountPage';
import { AccountMotorcycleReviewsPage } from './components/pages/AccountMotorcycleReviewsPage';
import { AccountReviewsPage } from './components/pages/AccountReviewsPage';
import { AccountRequestsPage } from './components/pages/AccountRequestsPage';
import { AdminDashboardPage, AdminModerationPage, AdminReviewsPage } from './components/pages/AdminPage';
import { AdminMotorcycleReviewsPage } from './components/pages/AdminMotorcycleReviewsPage';
import { AuthPage } from './components/pages/AuthPage';
import { BikeDetailPage } from './components/pages/BikeDetailPage';
import { ComparatorPage } from './components/pages/ComparatorPage';
import { CommunityReviewsPage } from './components/pages/CommunityReviewsPage';
import { MotorcycleCommunityPage } from './components/pages/MotorcycleCommunityPage';
import { SearchPage } from './components/pages/SearchPage';
import {
  DataMethodologyPage,
  DataSourcesPage,
  PrivacyPage,
  RequestModelPage,
  TermsPage,
} from './components/pages/StaticInfoPages';
import { TopRatedMotorcyclesPage } from './components/pages/TopRatedMotorcyclesPage';
import { FeaturedBikes } from './components/sections/FeaturedBikes';
import { Hero } from './components/sections/Hero';
import { LatestNews } from './components/sections/LatestNews';
import { MachineDuel } from './components/sections/MachineDuel';
import { ReliabilityReports } from './components/sections/ReliabilityReports';
import { ScrollToTopButton } from './components/ui/ScrollToTopButton';
import { bikeCatalog } from './data/bikes';
import { findBikeComparisonByHash } from './data/comparisons';
import { getMotorcycles } from './services/motorcycleService';
import { loadCompareQueue } from './utils/compareQueue';
import type { Bike } from './types/bike';
import {
  getBikeDetailIdFromRoute,
  getAccountReviewMotorcycleIdFromRoute,
  getCommunityMotorcycleIdFromRoute,
  getAdminMotorcycleIdFromRoute,
  getComparatorSelectionFromRoute,
  getCurrentAppRoute,
  getStaticInfoRouteKey,
  isAccountReviewsRoute,
  isAccountRoute,
  isAccountRequestsRoute,
  isAccountMotorcycleReviewsRoute,
  isAdminModerationRoute,
  isAdminReviewsRoute,
  isAdminMotorcycleReviewsRoute,
  isAdminRoute,
  isCommunityReviewsRoute,
  isCommunityRoute,
  isComparatorRoute,
  isLoginRoute,
  isRegisterRoute,
  isSearchRoute,
  isTopRatedRoute,
} from './shared/routing/routeUtils';
import { applySeoMetadata, buildAccountMotorcycleReviewsSeoMetadata, buildAdminSeoMetadata, buildAuthSeoMetadata, buildBikeSeoMetadata, buildCommunityLandingSeoMetadata, buildCommunityReviewsSeoMetadata, buildCommunitySeoMetadata, buildCompareSeoMetadata, buildStaticInfoSeoMetadata, buildTopRatedSeoMetadata } from './shared/seo/seoUtils';

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
    </main>
  );
}

export function App() {
  const route = useAppRoute();
  const [motorcycles, setMotorcycles] = useState<readonly Bike[]>(bikeCatalog);
  const legacyComparison = findBikeComparisonByHash(route);
  const legacyComparisonIds = legacyComparison?.bikes.map((bike) => bike.bikeId) ?? [];
  const bikeDetailId = getBikeDetailIdFromRoute(route, motorcycles);
  const accountReviewMotorcycleId = getAccountReviewMotorcycleIdFromRoute(route, motorcycles);
  const adminMotorcycleId = getAdminMotorcycleIdFromRoute(route, motorcycles);
  const communityMotorcycleId = getCommunityMotorcycleIdFromRoute(route, motorcycles);
  const findMotorcycleById = (id: Bike['id']) => motorcycles.find((bike) => bike.id === id);
  const detailBike = bikeDetailId ? findMotorcycleById(bikeDetailId) : undefined;
  const accountReviewMotorcycleBike = accountReviewMotorcycleId ? findMotorcycleById(accountReviewMotorcycleId) : undefined;
  const communityBike = communityMotorcycleId ? findMotorcycleById(communityMotorcycleId) : undefined;
  const staticInfoRouteKey = getStaticInfoRouteKey(route);
  const isSearchPage = isSearchRoute(route);
  const isLoginPage = isLoginRoute(route);
  const isRegisterPage = isRegisterRoute(route);
  const isAccountPage = isAccountRoute(route);
  const isAccountReviewsPage = isAccountReviewsRoute(route);
  const isAccountMotorcycleReviewsPage = isAccountMotorcycleReviewsRoute(route);
  const isAccountRequestsPage = isAccountRequestsRoute(route);
  const isAdminPage = isAdminRoute(route);
  const isAdminModerationPage = isAdminModerationRoute(route);
  const isAdminReviewsPage = isAdminReviewsRoute(route);
  const isAdminMotorcycleReviewsPage = isAdminMotorcycleReviewsRoute(route);
  const isTopRatedPage = isTopRatedRoute(route);
  const isComparatorPage = isComparatorRoute(route) || Boolean(legacyComparison);
  const isCommunityPage = isCommunityRoute(route);
  const isCommunityReviewsPage = isCommunityReviewsRoute(route);
  const isCommunityLandingPage = isCommunityPage && !communityMotorcycleId && !isCommunityReviewsPage;
  const routeComparatorSelection = getComparatorSelectionFromRoute(route, motorcycles);
  const persistedComparatorIds = isComparatorPage && routeComparatorSelection.rawIds.length === 0 && legacyComparisonIds.length === 0
    ? loadCompareQueue()
    : [];
  const comparatorIds = legacyComparisonIds.length > 0
    ? legacyComparisonIds
    : routeComparatorSelection.ids.length > 0
      ? routeComparatorSelection.ids
      : persistedComparatorIds;
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
    if (isLoginPage) {
      applySeoMetadata(buildAuthSeoMetadata('login'));
      return;
    }

    if (isRegisterPage) {
      applySeoMetadata(buildAuthSeoMetadata('registro'));
      return;
    }

    if (isAccountMotorcycleReviewsPage && accountReviewMotorcycleId) {
      applySeoMetadata(buildAccountMotorcycleReviewsSeoMetadata(accountReviewMotorcycleId));
      return;
    }

    if (isAdminModerationPage) {
      applySeoMetadata(buildAdminSeoMetadata('moderacion'));
      return;
    }

    if (isAdminMotorcycleReviewsPage && adminMotorcycleId) {
      applySeoMetadata(buildAdminSeoMetadata('reviews'));
      return;
    }

    if (isAdminReviewsPage) {
      applySeoMetadata(buildAdminSeoMetadata('reviews'));
      return;
    }

    if (isAdminPage) {
      applySeoMetadata(buildAdminSeoMetadata('admin'));
      return;
    }

    if (isAccountRequestsPage) {
      applySeoMetadata(buildAuthSeoMetadata('cuenta-solicitudes'));
      return;
    }

    if (isAccountReviewsPage) {
      applySeoMetadata(buildAuthSeoMetadata('cuenta-reviews'));
      return;
    }

    if (isAccountPage) {
      applySeoMetadata(buildAuthSeoMetadata('cuenta'));
      return;
    }

    if (staticInfoRouteKey) {
      applySeoMetadata(buildStaticInfoSeoMetadata(staticInfoRouteKey));
      return;
    }

    if (isCommunityLandingPage) {
      applySeoMetadata(buildCommunityLandingSeoMetadata());
      return;
    }

    if (isCommunityReviewsPage) {
      applySeoMetadata(buildCommunityReviewsSeoMetadata());
      return;
    }

    if (isTopRatedPage) {
      applySeoMetadata(buildTopRatedSeoMetadata());
      return;
    }

    if (isCommunityPage && communityBike) {
      applySeoMetadata(buildCommunitySeoMetadata(communityBike));
      return;
    }

    if (detailBike) {
      applySeoMetadata(buildBikeSeoMetadata(detailBike));
      return;
    }

    if (isComparatorPage && comparatorBikes.length >= 2) {
      applySeoMetadata(buildCompareSeoMetadata(comparatorBikes));
      return;
    }

    if (isComparatorPage && comparatorBikes.length < 2) {
      applySeoMetadata({
        canonicalUrl: 'https://motoatlas.com/comparador',
        description: 'Compara motos por prestaciones, peso, potencia, equipamiento y datos técnicos para elegir con criterio.',
        title: 'Comparador de motos | MotoAtlas',
      });
      return;
    }

    if (isSearchPage) {
      applySeoMetadata({
        canonicalUrl: 'https://motoatlas.com/buscador',
        description: 'Filtra por marca, segmento, precio, potencia, peso y equipamiento. Encuentra tu moto ideal entre cientos de modelos.',
        title: 'Buscador de motos | MotoAtlas',
      });
      return;
    }

    applySeoMetadata({
      canonicalUrl: 'https://motoatlas.com/',
      description: 'Explora el catálogo técnico de motos, compara modelos y lee reviews reales de la comunidad motera. Decisiones informadas para moteros exigentes.',
      title: 'MotoAtlas | Catálogo técnico de motos',
    });
  }, [accountReviewMotorcycleId, communityBike, comparatorBikes, detailBike, isAccountMotorcycleReviewsPage, isAccountPage, isAccountRequestsPage, isAccountReviewsPage, isAdminModerationPage, isAdminPage, isAdminReviewsPage, isCommunityLandingPage, isCommunityPage, isCommunityReviewsPage, isComparatorPage, isLoginPage, isRegisterPage, isSearchPage, isTopRatedPage, staticInfoRouteKey]);

  return (
    <AuthProvider>
      <div className="app">
      <Navbar />
      {isLoginPage ? (
        <AuthPage mode="login" />
      ) : isRegisterPage ? (
        <AuthPage mode="register" />
      ) : isAdminModerationPage ? (
        <AdminModerationPage />
      ) : isAdminMotorcycleReviewsPage ? (
        <AdminMotorcycleReviewsPage bike={adminMotorcycleId ? findMotorcycleById(adminMotorcycleId) : undefined} motorcycleId={adminMotorcycleId} />
      ) : isAdminReviewsPage ? (
        <AdminReviewsPage />
      ) : isAdminPage ? (
        <AdminDashboardPage />
      ) : isAccountMotorcycleReviewsPage ? (
        <AccountMotorcycleReviewsPage bike={accountReviewMotorcycleBike} motorcycleId={accountReviewMotorcycleId} />
      ) : isAccountReviewsPage ? (
        <AccountReviewsPage />
      ) : isAccountRequestsPage ? (
        <AccountRequestsPage />
      ) : isAccountPage ? (
        <AccountPage />
      ) : isComparatorPage ? (
        <ComparatorPage
          bikes={comparatorBikes}
          ignoredBikeCount={routeComparatorSelection.ignoredIds.length}
          missingBikeCount={missingComparatorIds.length}
          motorcycles={motorcycles}
        />
      ) : isCommunityLandingPage ? (
        <TopRatedMotorcyclesPage motorcycles={motorcycles} />
      ) : isCommunityReviewsPage ? (
        <CommunityReviewsPage />
      ) : isCommunityPage ? (
        <MotorcycleCommunityPage bike={communityBike} motorcycleId={communityMotorcycleId} />
      ) : bikeDetailId ? (
        <BikeDetailPage bike={detailBike} motorcycles={motorcycles} />
      ) : isSearchPage ? (
        <SearchPage motorcycles={motorcycles} routeHash={route} />
      ) : isTopRatedPage ? (
        <TopRatedMotorcyclesPage motorcycles={motorcycles} />
      ) : staticInfoRouteKey === 'metodologia' ? (
        <DataMethodologyPage />
      ) : staticInfoRouteKey === 'fuentes-datos' ? (
        <DataSourcesPage />
      ) : staticInfoRouteKey === 'solicitar-modelo' ? (
        <RequestModelPage />
      ) : staticInfoRouteKey === 'privacidad' ? (
        <PrivacyPage />
      ) : staticInfoRouteKey === 'terminos' ? (
        <TermsPage />
      ) : (
        <HomePage />
      )}
      <ScrollToTopButton />
      <Footer />
      </div>
    </AuthProvider>
  );
}
