import type { Bike } from './bike';

export type ComparisonBikePosition = 'left' | 'right';

export type ComparisonHeroBike = Readonly<{
  bikeId: Bike['id'];
  tagline: string;
  position: ComparisonBikePosition;
}>;

export type ComparisonVoteSummary = Readonly<{
  leftPercent: number;
  rightPercent: number;
  totalVotes: number;
  marginOfErrorPercent: number;
  topComment: string;
  topCommentAuthor: string;
}>;

export type ComparisonVerdict = Readonly<{
  id: string;
  icon: string;
  title: string;
  description: string;
  winnerBikeId: Bike['id'];
}>;

export type ComparisonScore = Readonly<{
  id: string;
  label: string;
  leftScore: number;
  rightScore: number;
}>;

export type ComparisonReport = Readonly<{
  id: string;
  icon: string;
  severity: 'BAJA' | 'MEDIA' | 'ALTA';
  title: string;
  description: string;
  reportCount: number;
}>;

export type ComparisonVideo = Readonly<{
  id: string;
  title: string;
  duration: string;
  imageUrl: string;
  alt: string;
}>;

export type BikeComparison = Readonly<{
  id: string;
  routeHash: `#/comparativas/${string}`;
  title: string;
  subtitle: string;
  bikes: readonly [ComparisonHeroBike, ComparisonHeroBike];
  voteSummary: ComparisonVoteSummary;
  verdicts: readonly ComparisonVerdict[];
  scores: readonly ComparisonScore[];
  reports: readonly ComparisonReport[];
  videos: readonly ComparisonVideo[];
}>;
