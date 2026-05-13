import type { News } from '../../../types/news';
import './NewsCard.scss';

type NewsCardProps = {
  item: News;
  variant?: 'featured' | 'compact';
};

export function NewsCard({ item, variant = 'compact' }: NewsCardProps) {
  return (
    <article className={`news-card news-card--${variant}`}>
      <div className="news-card__media">
        <img src={item.image} alt={item.alt} loading="lazy" />
      </div>

      <div className="news-card__content">
        <span>{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
      </div>
    </article>
  );
}
