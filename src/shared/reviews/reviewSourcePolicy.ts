import {
  canUseDemoData,
  getRuntimeEnvironment,
  isProductionEnvironment,
  type RuntimeEnvironmentInput,
} from '../env/runtimeEnvironment'

export type ReviewSource = 'user' | 'seed' | 'mock'

export type ReviewSourcePolicyOptions = Readonly<{
  env?: RuntimeEnvironmentInput
}>

export { getRuntimeEnvironment, isProductionEnvironment }
export const shouldIncludeDemoData = canUseDemoData

export function getAllowedReviewSources(options?: ReviewSourcePolicyOptions): readonly ReviewSource[] {
  if (canUseDemoData(options?.env)) {
    return ['user', 'seed', 'mock']
  }

  return ['user']
}
