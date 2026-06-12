import { describe, expect, it } from 'vitest'
import {
  canUseDemoData,
  clearDemoDataPreference,
  getDemoDataPreference,
  getRuntimeEnvironment,
  isDemoDataToggleAvailable,
  isDevelopmentEnvironment,
  isPreviewEnvironment,
  isProductionEnvironment,
  setDemoDataPreference,
  type RuntimeStorageLike,
} from './runtimeEnvironment'

function createStorage(initialValue?: string): RuntimeStorageLike {
  const store = new Map<string, string>()

  if (initialValue !== undefined) {
    store.set('motoatlas.includeDemoData', initialValue)
  }

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('runtimeEnvironment', () => {
  it('production never allows demo data even when enabled by env', () => {
    const env = { VITE_APP_ENV: 'production', VITE_ENABLE_DEMO_DATA: 'true' }
    expect(getRuntimeEnvironment(env)).toBe('production')
    expect(isProductionEnvironment(env)).toBe(true)
    expect(isDemoDataToggleAvailable(env)).toBe(false)
    expect(canUseDemoData(env)).toBe(false)
  })

  it('production ignores local preference enabled', () => {
    const env = { VITE_APP_ENV: 'production' }
    const storage = createStorage('true')
    expect(canUseDemoData(env, storage)).toBe(false)
  })

  it('preview with demo enabled allows demo data', () => {
    const env = { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'true' }
    expect(getRuntimeEnvironment(env)).toBe('preview')
    expect(isPreviewEnvironment(env)).toBe(true)
    expect(isDemoDataToggleAvailable(env)).toBe(true)
    expect(canUseDemoData(env)).toBe(true)
  })

  it('preview with demo disabled does not allow demo data', () => {
    const env = { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'false' }
    expect(canUseDemoData(env)).toBe(false)
  })

  it('development with demo enabled allows demo data', () => {
    const env = { VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'true' }
    expect(getRuntimeEnvironment(env)).toBe('development')
    expect(isDevelopmentEnvironment(env)).toBe(true)
    expect(canUseDemoData(env)).toBe(true)
  })

  it('development with demo disabled does not allow demo data', () => {
    const env = { VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'false' }
    expect(canUseDemoData(env)).toBe(false)
  })

  it('local preference enables demo data in preview/development even if env default is false', () => {
    const env = { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'false' }
    const storage = createStorage()
    setDemoDataPreference(true, storage)

    expect(getDemoDataPreference(storage)).toBe(true)
    expect(canUseDemoData(env, storage)).toBe(true)
  })

  it('local preference disables demo data in preview/development even if env default is true', () => {
    const env = { VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'true' }
    const storage = createStorage()
    setDemoDataPreference(false, storage)

    expect(getDemoDataPreference(storage)).toBe(false)
    expect(canUseDemoData(env, storage)).toBe(false)
  })

  it('invalid localStorage value falls back safely and is cleared', () => {
    const env = { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'true' }
    const storage = createStorage('banana')

    expect(canUseDemoData(env, storage)).toBe(true)
    expect(getDemoDataPreference(storage)).toBe(null)
    expect(storage.getItem('motoatlas.includeDemoData')).toBe(null)
  })

  it('clearDemoDataPreference restores env/default behavior', () => {
    const env = { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'false' }
    const storage = createStorage()

    setDemoDataPreference(true, storage)
    expect(canUseDemoData(env, storage)).toBe(true)

    clearDemoDataPreference(storage)
    expect(getDemoDataPreference(storage)).toBe(null)
    expect(canUseDemoData(env, storage)).toBe(false)
  })

  it('defaults to current non-production behavior when development env is known and demo flag is absent', () => {
    const env = { DEV: true }
    expect(getRuntimeEnvironment(env)).toBe('development')
    expect(canUseDemoData(env)).toBe(true)
  })

  it('unknown env defaults to production-safe behavior', () => {
    const env = { VITE_APP_ENV: 'staging', VITE_ENABLE_DEMO_DATA: 'true', DEV: true }
    expect(getRuntimeEnvironment(env)).toBe('production')
    expect(isDemoDataToggleAvailable(env)).toBe(false)
    expect(canUseDemoData(env)).toBe(false)
  })
})
