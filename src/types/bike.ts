export type BikeSegment = 'trail' | 'naked' | 'sport-touring';

export type BikeLicense = 'A2' | 'A';

export type BikeEngineType =
  | 'single-cylinder'
  | 'parallel-twin'
  | 'inline-three'
  | 'inline-four'
  | 'v-twin'
  | 'l-twin'
  | 'boxer-twin';

export type BikeUseScores = Readonly<{
  city: number;
  touring: number;
  offroad: number;
  passenger: number;
  beginner: number;
  sport: number;
  funFactor: number;
}>;

export type BikeFeatures = Readonly<{
  absCornering: boolean;
  tractionControl: boolean;
  ridingModes: boolean;
  cruiseControl: boolean;
  quickshifter: boolean;
  heatedGrips: boolean;
  tubelessWheels: boolean;
}>;

export type BikeReliabilityReports = Readonly<{
  commonIssues: readonly string[];
  reportCount: number;
  reliabilityScore: number;
}>;

export type Bike = Readonly<{
  id: string;
  brand: string;
  model: string;
  year: number;
  segment: BikeSegment;
  license: BikeLicense;
  engineType: BikeEngineType;
  displacementCc: number;
  powerHp: number;
  torqueNm: number;
  wetWeightKg: number;
  seatHeightMm: number;
  fuelTankLiters: number;
  priceEur: number;
  imageUrl: string;
  description: string;
  useScores: BikeUseScores;
  features: BikeFeatures;
  pros: readonly string[];
  cons: readonly string[];
  reliabilityReports: BikeReliabilityReports;
}>;

export type BikeSpec = Readonly<{
  label: string;
  value: string;
}>;

export type ComparisonBikeAccent = 'red' | 'neutral';

export type ComparisonBike = Readonly<{
  id: Bike['id'];
  name: string;
  subtitle: string;
  image: Bike['imageUrl'];
  alt: Bike['description'];
  accent: ComparisonBikeAccent;
  specs: readonly BikeSpec[];
}>;
