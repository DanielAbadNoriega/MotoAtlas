export type RouteDifficulty = 'BAJA' | 'MEDIA' | 'ALTA';

export type Route = Readonly<{
  id: string;
  title: string;
  location: string;
  distance: string;
  difficulty: RouteDifficulty;
  progress: number;
  image: string;
  alt: string;
}>;


export type RouteCopy = Readonly<{
  difficultyLabel: string;
}>;
