export type Route = {
  id: string;
  title: string;
  location: string;
  distance: string;
  difficulty: 'BAJA' | 'MEDIA' | 'ALTA';
  progress: number;
  image: string;
  alt: string;
};
