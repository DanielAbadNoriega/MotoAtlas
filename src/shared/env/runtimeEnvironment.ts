export type RuntimeEnvironment = 'development' | 'preview' | 'production'

export type RuntimeEnvironmentInput = Readonly<{
  DEV?: boolean
  MODE?: string
  PROD?: boolean
  VITE_APP_ENV?: string
  VITE_ENABLE_DEMO_DATA?: string
}>

const VALID_ENVIRONMENTS: readonly RuntimeEnvironment[] = ['development', 'preview', 'production']

function normalizeEnvironment(value?: string): RuntimeEnvironment | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if ((VALID_ENVIRONMENTS as readonly string[]).includes(normalized)) {
    return normalized as RuntimeEnvironment
  }
  return null
}

function readRuntimeEnvironment(env: RuntimeEnvironmentInput): RuntimeEnvironment {
  const explicitEnvironment = normalizeEnvironment(env.VITE_APP_ENV)
  if (explicitEnvironment) {
    return explicitEnvironment
  }

  if (typeof env.VITE_APP_ENV === 'string' && env.VITE_APP_ENV.trim().length > 0) {
    return 'production'
  }

  if (env.PROD === true) {
    return 'production'
  }

  if (env.MODE === 'preview') {
    return 'preview'
  }

  if (env.DEV === true) {
    return 'development'
  }

  return 'production'
}

function readDemoDataFlag(env: RuntimeEnvironmentInput): boolean | null {
  const normalized = String(env.VITE_ENABLE_DEMO_DATA ?? '').trim().toLowerCase()
  if (!normalized) {
    return null
  }

  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  return false
}

function getDefaultRuntimeEnvironmentInput(): RuntimeEnvironmentInput {
  return import.meta.env
}

export function getRuntimeEnvironment(env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput()): RuntimeEnvironment {
  return readRuntimeEnvironment(env)
}

export function isProductionEnvironment(env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput()): boolean {
  return getRuntimeEnvironment(env) === 'production'
}

export function isPreviewEnvironment(env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput()): boolean {
  return getRuntimeEnvironment(env) === 'preview'
}

export function isDevelopmentEnvironment(env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput()): boolean {
  return getRuntimeEnvironment(env) === 'development'
}

export function canUseDemoData(env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput()): boolean {
  const runtimeEnvironment = getRuntimeEnvironment(env)
  if (runtimeEnvironment === 'production') {
    return false
  }

  const explicitDemoFlag = readDemoDataFlag(env)
  if (explicitDemoFlag !== null) {
    return explicitDemoFlag
  }

  return true
}
