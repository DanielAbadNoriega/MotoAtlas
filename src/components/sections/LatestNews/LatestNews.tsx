import { news } from '../../../data/news';
import { NewsCard } from '../../ui/NewsCard';
import './LatestNews.scss';

export function LatestNews() {
  const [featuredNews, ...secondaryNews] = news;

  return (
    <section className="latest-news fade-in" id="noticias" aria-labelledby="latest-news-title">
      <h2 className="section-title" id="latest-news-title">
        Últimas noticias
      </h2>

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
