export type BikeSpec = Readonly<{
  label: string;
  value: string;
}>;

export type Bike = Readonly<{
  id: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  specs: readonly BikeSpec[];
}>;

export type ComparisonBikeAccent = 'red' | 'neutral';

export type ComparisonBike = Readonly<{
  id: string;
  name: string;
  subtitle: string;
  image: string;
  alt: string;
  accent: ComparisonBikeAccent;
  specs: readonly BikeSpec[];
}>;
