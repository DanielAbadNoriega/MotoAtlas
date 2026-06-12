import { describe, expect, it } from 'vitest'
import {
  getAllowedReviewSources,
  getRuntimeEnvironment,
  isProductionEnvironment,
  shouldIncludeDemoData,
} from './reviewSourcePolicy'

describe('reviewSourcePolicy', () => {
  describe('runtime environment delegation', () => {
    it('recognizes production from the centralized guard', () => {
      const env = { VITE_APP_ENV: 'production', VITE_ENABLE_DEMO_DATA: 'true' }
      expect(getRuntimeEnvironment(env)).toBe('production')
      expect(isProductionEnvironment(env)).toBe(true)
    })
  })

  describe('shouldIncludeDemoData', () => {
    it('returns false in production regardless of VITE_ENABLE_DEMO_DATA', () => {
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'production', VITE_ENABLE_DEMO_DATA: 'true' })).toBe(false)
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'production', VITE_ENABLE_DEMO_DATA: 'false' })).toBe(false)
    })

    it('returns true in preview with demo enabled', () => {
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'true' })).toBe(true)
    })

    it('returns false in preview with demo disabled', () => {
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'false' })).toBe(false)
    })

    it('returns true in development with demo enabled', () => {
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'true' })).toBe(true)
    })

    it('returns false in development with demo disabled', () => {
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'false' })).toBe(false)
    })

    it('defaults to production-safe behavior when VITE_APP_ENV is unknown', () => {
      expect(shouldIncludeDemoData({ VITE_APP_ENV: 'staging', VITE_ENABLE_DEMO_DATA: 'true' })).toBe(false)
    })
  })

  describe('getAllowedReviewSources', () => {
    it('production returns only user', () => {
      expect(getAllowedReviewSources({ env: { VITE_APP_ENV: 'production', VITE_ENABLE_DEMO_DATA: 'true' } })).toEqual(['user'])
    })

    it('preview with demo enabled returns user, seed, mock', () => {
      expect(getAllowedReviewSources({ env: { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'true' } })).toEqual(['user', 'seed', 'mock'])
    })

    it('preview with demo disabled returns only user', () => {
      expect(getAllowedReviewSources({ env: { VITE_APP_ENV: 'preview', VITE_ENABLE_DEMO_DATA: 'false' } })).toEqual(['user'])
    })

    it('development with demo enabled returns user, seed, mock', () => {
      expect(getAllowedReviewSources({ env: { VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'true' } })).toEqual(['user', 'seed', 'mock'])
    })

    it('development with demo disabled returns only user', () => {
      expect(getAllowedReviewSources({ env: { VITE_APP_ENV: 'development', VITE_ENABLE_DEMO_DATA: 'false' } })).toEqual(['user'])
    })

    it('keeps previous non-production default when development env is known and the demo flag is absent', () => {
      expect(getAllowedReviewSources({ env: { DEV: true } })).toEqual(['user', 'seed', 'mock'])
    })

    it('returns only user when demo data is not allowed', () => {
      expect(getAllowedReviewSources({ env: { VITE_APP_ENV: 'staging', VITE_ENABLE_DEMO_DATA: 'true' } })).toEqual(['user'])
    })
  })
})
