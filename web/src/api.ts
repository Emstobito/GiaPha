import type { PersonDetail, SearchHit, TreeResponse } from '@giapha/shared';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export const api = {
  tree: () => getJson<TreeResponse>('/api/tree'),
  person: (id: number) => getJson<PersonDetail>(`/api/persons/${id}`),
  search: (q: string) => getJson<SearchHit[]>(`/api/search?q=${encodeURIComponent(q)}`),
};
