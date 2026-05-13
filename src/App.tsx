import { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { ComparisonDetailPage } from './components/pages/ComparisonDetailPage';
import { SearchPage } from './components/pages/SearchPage';
import { FeaturedBikes } from './components/sections/FeaturedBikes';
import { Hero } from './components/sections/Hero';
import { LatestNews } from './components/sections/LatestNews';
import { MachineDuel } from './components/sections/MachineDuel';
import { ReliabilityReports } from './components/sections/ReliabilityReports';
import { RoutesSection } from './components/sections/RoutesSection';
import { findBikeComparisonByHash } from './data/comparisons';

const scrollToPageTop = () => {
  window.scrollTo({ left: 0, top: 0 });
};

function getCurrentHash() {
  return typeof window === 'undefined' ? '' : window.location.hash;
}

function useHashRoute() {
  const [hash, setHash] = useState(getCurrentHash);

  useEffect(() => {
    const handleHashChange = () => setHash(getCurrentHash());

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return hash;
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
  const hash = useHashRoute();
  const comparison = findBikeComparisonByHash(hash);
  const isSearchRoute = hash === '#/buscador' || hash === '#/catalogo';

  useEffect(() => {
    if (hash.startsWith('#/')) {
      scrollToPageTop();
    }
  }, [hash]);

  return (
    <div className="app">
      <Navbar />
      {comparison ? <ComparisonDetailPage comparison={comparison} /> : isSearchRoute ? <SearchPage /> : <HomePage />}
      <Footer />
    </div>
  );
}
