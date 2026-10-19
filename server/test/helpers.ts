import { openDb } from '../src/db/client.js';
import { insertSampleFamily } from '../src/db/sample-family.js';
import { loadFamily } from '../src/domain/family.js';
import { FamilyIndex, computeGenerations, findRoots } from '../src/domain/tree.js';

export function sampleDb() {
  const { db, sqlite } = openDb(':memory:');
  const ids = insertSampleFamily(db);
  return { db, sqlite, ids };
}

export function sampleIndex() {
  const { db, ids } = sampleDb();
  const index = new FamilyIndex(loadFamily(db));
  const roots = findRoots(index);
  return { db, ids, index, roots, generations: computeGenerations(index, roots) };
}
