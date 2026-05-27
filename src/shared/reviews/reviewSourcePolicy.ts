export type ReviewSource = 'user' | 'seed' | 'mock';

export type ReviewSourcePolicyOptions = Readonly<{
  isProduction?: boolean;
  demoEnabled?: boolean;
}>;

export function isProductionEnvironment(): boolean {
  return import.meta.env.PROD === true;
}

export function shouldIncludeDemoData(options?: ReviewSourcePolicyOptions): boolean {
  const isProduction = options?.isProduction ?? isProductionEnvironment();
  if (isProduction) {
    return false;
  }
  return options?.demoEnabled ?? true;
}

export function getAllowedReviewSources(options?: ReviewSourcePolicyOptions): readonly ReviewSource[] {
  const isProduction = options?.isProduction ?? isProductionEnvironment();
  const includeDemo = shouldIncludeDemoData({ isProduction, demoEnabled: options?.demoEnabled });
  if (isProduction) {
    return ['user'];
  }
  if (includeDemo) {
    return ['user', 'seed', 'mock'];
  }
  return ['user'];
}