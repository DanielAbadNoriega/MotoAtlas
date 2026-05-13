import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { FeaturedBikes } from './components/sections/FeaturedBikes';
import { Hero } from './components/sections/Hero';
import { LatestNews } from './components/sections/LatestNews';
import { MachineDuel } from './components/sections/MachineDuel';
import { ReliabilityReports } from './components/sections/ReliabilityReports';
import { RoutesSection } from './components/sections/RoutesSection';

export function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <FeaturedBikes />
        <MachineDuel />
        <LatestNews />
        <ReliabilityReports />
        <RoutesSection />
      </main>
      <Footer />
    </div>
  );
}
