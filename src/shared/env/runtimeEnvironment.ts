export type RuntimeEnvironment = 'development' | 'preview' | 'production'

export type RuntimeEnvironmentInput = Readonly<{
  DEV?: boolean
  MODE?: string
  PROD?: boolean
  VITE_APP_ENV?: string
  VITE_ENABLE_DEMO_DATA?: string
}>

export type RuntimeStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const VALID_ENVIRONMENTS: readonly RuntimeEnvironment[] = ['development', 'preview', 'production']
const DEMO_DATA_PREFERENCE_KEY = 'motoatlas.includeDemoData'

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

function parseDemoDataPreference(value: string | null): boolean | null {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return null
}

function getDefaultRuntimeEnvironmentInput(): RuntimeEnvironmentInput {
  return import.meta.env
}

function getDefaultStorage(): RuntimeStorageLike | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch (_error) {
    return null
  }
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

export function isDemoDataToggleAvailable(env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput()): boolean {
  const runtimeEnvironment = getRuntimeEnvironment(env)
  return runtimeEnvironment === 'development' || runtimeEnvironment === 'preview'
}

export function getDemoDataPreference(storage: RuntimeStorageLike | null = getDefaultStorage()): boolean | null {
  if (!storage) {
    return null
  }

  try {
    const value = storage.getItem(DEMO_DATA_PREFERENCE_KEY)
    const parsed = parseDemoDataPreference(value)

    if (parsed !== null) {
      return parsed
    }

    if (value !== null) {
      storage.removeItem(DEMO_DATA_PREFERENCE_KEY)
    }
  } catch (_error) {
    return null
  }

  return null
}

export function setDemoDataPreference(enabled: boolean, storage: RuntimeStorageLike | null = getDefaultStorage()): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(DEMO_DATA_PREFERENCE_KEY, enabled ? 'true' : 'false')
  } catch (_error) {
    // noop: local runtime preference is best-effort only
  }
}

export function clearDemoDataPreference(storage: RuntimeStorageLike | null = getDefaultStorage()): void {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(DEMO_DATA_PREFERENCE_KEY)
  } catch (_error) {
    // noop: local runtime preference is best-effort only
  }
}

export function canUseDemoData(
  env: RuntimeEnvironmentInput = getDefaultRuntimeEnvironmentInput(),
  storage: RuntimeStorageLike | null = getDefaultStorage(),
): boolean {
  if (!isDemoDataToggleAvailable(env)) {
    return false
  }

  const storedPreference = getDemoDataPreference(storage)
  if (storedPreference !== null) {
    return storedPreference
  }

  const explicitDemoFlag = readDemoDataFlag(env)
  if (explicitDemoFlag !== null) {
    return explicitDemoFlag
  }

  return true
}
