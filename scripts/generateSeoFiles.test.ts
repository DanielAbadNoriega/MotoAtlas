import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bikeFixtures } from '../src/test/fixtures/bikes';
import { generateSeoFiles } from './generateSeoFiles';

describe('generateSeoFiles', () => {
  it('genera sitemap con motos y robots sin tocar red', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'motoatlas-seo-'));
    const sitemapFileUrl = new URL(`file://${path.join(tempDir, 'sitemap.xml')}`);
    const robotsFileUrl = new URL(`file://${path.join(tempDir, 'robots.txt')}`);

    const result = await generateSeoFiles({
      motorcycles: bikeFixtures.slice(0, 2),
      robotsFileUrl,
      sitemapFileUrl,
    });

    expect(result.sitemapXml).toContain('https://motoatlas.com/motos/bmw-f-900-gs');
    expect(result.robotsTxt).toContain('Sitemap: https://motoatlas.com/sitemap.xml');
    expect(result.urlCount).toBeGreaterThan(2);
    expect(await readFile(sitemapFileUrl, 'utf8')).toContain('https://motoatlas.com/motos/bmw-f-900-gs');
    expect(await readFile(robotsFileUrl, 'utf8')).toContain('Allow: /');
  });
});
