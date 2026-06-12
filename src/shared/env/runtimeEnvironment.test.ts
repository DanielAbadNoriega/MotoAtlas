import { describe, expect, it } from 'vitest'
import {
  canUseDemoData,
  getRuntimeEnvironment,
  isDevelopmentEnvironment,
  isPreviewEnvironment,
  isProductionEnvironment,
} from './runtimeEnvironment'

describe('runtimeEnvironment', () => {
  it('production never allows demo data even when enabled by env', () => {
    const env = { VITE_APP_ENV: 'production', VITE_ENABLE_DEMO_DATA: 'true' }
    expect(getRuntimeEnvironment(env)).toBe('production')
    expect(isProductionEnvironment(env)).toBe(true)
    expect(canUseDemoData(env)).toBe(false)
  })

  it('preview with demo enabled allows demo data', () => {
    const env = { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'true' }
    expect(getRuntimeEnvironment(env)).toBe('preview')
    expect(isPreviewEnvironment(env)).toBe(true)
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

  it('defaults to current non-production behavior when development env is known and demo flag is absent', () => {
    const env = { DEV: true }
    expect(getRuntimeEnvironment(env)).toBe('development')
    expect(canUseDemoData(env)).toBe(true)
  })

  it('unknown env defaults to production-safe behavior', () => {
    const env = { VITE_APP_ENV: 'staging', VITE_ENABLE_DEMO_DATA: 'true', DEV: true }
    expect(getRuntimeEnvironment(env)).toBe('production')
    expect(canUseDemoData(env)).toBe(false)
  })
})
