import type { ApiNinjasMotorcycle, MotorcycleSeed } from './motorcycleImportTypes';

export const API_NINJAS_MOTORCYCLES_URL = 'https://api.api-ninjas.com/v1/motorcycles';

export type ApiNinjasFetch = typeof fetch;

export type ApiNinjasMotorcycleClientOptions = Readonly<{
  apiKey: string;
  endpoint?: string;
  fetchImpl?: ApiNinjasFetch;
}>;

export type SearchApiNinjasMotorcyclesOptions = Readonly<{
  seed: MotorcycleSeed;
}>;

export function createApiNinjasMotorcycleClient({
  apiKey,
  endpoint = API_NINJAS_MOTORCYCLES_URL,
  fetchImpl = fetch,
}: ApiNinjasMotorcycleClientOptions) {
  async function searchMotorcycles({ seed }: SearchApiNinjasMotorcyclesOptions) {
    const url = new URL(endpoint);
    url.searchParams.set('make', seed.make);
    url.searchParams.set('model', seed.model);
    url.searchParams.set('year', String(seed.year));

    const response = await fetchImpl(url, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Ninjas motorcycles falló (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as unknown;

    if (!Array.isArray(payload)) {
      throw new Error('API Ninjas motorcycles devolvió una respuesta no compatible.');
    }

    return payload as ApiNinjasMotorcycle[];
  }

  return { searchMotorcycles };
}
