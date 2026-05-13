export type BikeSpec = {
  label: string;
  value: string;
};

export type Bike = {
  id: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  specs: BikeSpec[];
};

export type ComparisonBike = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  alt: string;
  accent: 'red' | 'neutral';
  specs: BikeSpec[];
};
