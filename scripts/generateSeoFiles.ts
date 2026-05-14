import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importPaths, readJsonFile } from '../src/features/import/importUtils';
import { buildRobotsTxt, buildSitemapXml, getSitemapUrls } from '../src/shared/seo/seoUtils';
import type { Bike } from '../src/types/bike';

export type GenerateSeoFilesOptions = Readonly<{
  motorcycles?: readonly Bike[];
  robotsFileUrl?: URL;
  sitemapFileUrl?: URL;
}>;

export async function generateSeoFiles({
  motorcycles,
  robotsFileUrl = new URL('../public/robots.txt', import.meta.url),
  sitemapFileUrl = new URL('../public/sitemap.xml', import.meta.url),
}: GenerateSeoFilesOptions = {}) {
  const sourceMotorcycles = motorcycles ?? (await readJsonFile<readonly Bike[]>(importPaths.motorcyclesFileUrl));
  const urls = getSitemapUrls(sourceMotorcycles);
  const sitemapXml = buildSitemapXml(urls);
  const robotsTxt = buildRobotsTxt();

  await writeFile(fileURLToPath(sitemapFileUrl), sitemapXml, 'utf8');
  await writeFile(fileURLToPath(robotsFileUrl), robotsTxt, 'utf8');

  return { robotsTxt, sitemapXml, urlCount: urls.length, urls };
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isDirectRun) {
  generateSeoFiles()
    .then((result) => console.log(`✅ SEO generado: ${result.urlCount} URLs en sitemap.xml y robots.txt.`))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Generación SEO fallida: ${message}`);
      process.exitCode = 1;
    });
}
