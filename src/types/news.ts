export type News = Readonly<{
  id: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  alt: string;
  featured?: boolean;
}>;
