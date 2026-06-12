import {
  canUseDemoData,
  getRuntimeEnvironment,
  isProductionEnvironment,
  type RuntimeEnvironmentInput,
  type RuntimeStorageLike,
} from '../env/runtimeEnvironment'

export type ReviewSource = 'user' | 'seed' | 'mock'

export type ReviewSourcePolicyOptions = Readonly<{
  env?: RuntimeEnvironmentInput
  storage?: RuntimeStorageLike | null
}>

export { getRuntimeEnvironment, isProductionEnvironment }
export const shouldIncludeDemoData = canUseDemoData

export function getAllowedReviewSources(options?: ReviewSourcePolicyOptions): readonly ReviewSource[] {
  if (canUseDemoData(options?.env, options?.storage)) {
    return ['user', 'seed', 'mock']
  }

  return ['user']
}
