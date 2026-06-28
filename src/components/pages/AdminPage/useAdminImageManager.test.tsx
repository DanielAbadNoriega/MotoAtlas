import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminImageManager } from './useAdminImageManager';

describe('useAdminImageManager', () => {
  it('initial state has modal closed and URL mode', () => {
    const { result } = renderHook(() => useAdminImageManager());
    expect(result.current.isImageManagerOpen).toBe(false);
    expect(result.current.imageMode).toBe('url');
  });

  it('openImageManager sets isImageManagerOpen to true', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => result.current.openImageManager());
    expect(result.current.isImageManagerOpen).toBe(true);
  });

  it('closeImageManager sets isImageManagerOpen to false', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => {
      result.current.openImageManager();
      result.current.closeImageManager();
    });
    expect(result.current.isImageManagerOpen).toBe(false);
  });

  it('selectUrlMode switches imageMode to url', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => result.current.selectUploadMode());
    expect(result.current.imageMode).toBe('upload');
    act(() => result.current.selectUrlMode());
    expect(result.current.imageMode).toBe('url');
  });

  it('selectUploadMode switches imageMode to upload', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => result.current.selectUploadMode());
    expect(result.current.imageMode).toBe('upload');
  });

  it('galleryInfoCardKeys starts as empty set', () => {
    const { result } = renderHook(() => useAdminImageManager());
    expect(result.current.galleryInfoCardKeys.size).toBe(0);
  });

  it('handleToggleGalleryCardInfo adds a key', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => result.current.handleToggleGalleryCardInfo('card-1'));
    expect(result.current.galleryInfoCardKeys.has('card-1')).toBe(true);
    expect(result.current.galleryInfoCardKeys.size).toBe(1);
  });

  it('handleToggleGalleryCardInfo removes an existing key', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => result.current.handleToggleGalleryCardInfo('card-1'));
    act(() => result.current.handleToggleGalleryCardInfo('card-1'));
    expect(result.current.galleryInfoCardKeys.has('card-1')).toBe(false);
    expect(result.current.galleryInfoCardKeys.size).toBe(0);
  });

  it('resetGalleryInfoCardKeys clears the set', () => {
    const { result } = renderHook(() => useAdminImageManager());
    act(() => result.current.handleToggleGalleryCardInfo('card-1'));
    act(() => result.current.handleToggleGalleryCardInfo('card-2'));
    expect(result.current.galleryInfoCardKeys.size).toBe(2);
    act(() => result.current.resetGalleryInfoCardKeys());
    expect(result.current.galleryInfoCardKeys.size).toBe(0);
  });
});
