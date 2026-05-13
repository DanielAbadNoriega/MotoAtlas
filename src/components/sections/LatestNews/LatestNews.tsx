import { homeSections } from '../../../data/home';
import { news } from '../../../data/news';
import { NewsCard } from '../../ui/NewsCard';
import { SectionHeader } from '../../ui/SectionHeader';
import './LatestNews.scss';

export function LatestNews() {
  const featuredNews = news.find((item) => item.featured) ?? news[0];
  const secondaryNews = news.filter((item) => item.id !== featuredNews.id);

  return (
    <section className="latest-news fade-in" id="noticias" aria-labelledby="latest-news-title">
      <SectionHeader content={homeSections.latestNews} titleId="latest-news-title" />

      <div className="latest-news__grid">
        <NewsCard item={featuredNews} variant="featured" />
        <div className="latest-news__list">
          {secondaryNews.map((item) => (
            <NewsCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
