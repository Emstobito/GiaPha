import express, { type Request, type Response } from 'express';
import type { PersonDetail, TreeResponse, ViewerRole } from '@giapha/shared';
import type { Db } from '../db/client.js';
import { loadFamily } from '../domain/family.js';
import { searchPersons } from '../domain/search.js';
import { FamilyIndex, buildTree, computeGenerations, findRoots } from '../domain/tree.js';
import { loadVisibility, toPersonView } from '../domain/visibility.js';

/** Người đang xem. Giai đoạn 4 (đăng nhập) sẽ thay bằng vai trò thật từ session. */
function viewerOf(_req: Request): ViewerRole {
  return 'guest';
}

/** Dữ liệu dùng chung cho mọi API đọc — nạp mới mỗi request để luôn đúng sau khi có người sửa. */
function snapshot(db: Db) {
  const index = new FamilyIndex(loadFamily(db));
  const roots = findRoots(index);
  const generations = computeGenerations(index, roots);
  return { index, roots, generations, visibility: loadVisibility(db) };
}

export function createApp(db: Db) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/tree', (req: Request, res: Response) => {
    const { index, roots, generations, visibility } = snapshot(db);
    const viewer = viewerOf(req);
    const requestedRoot = req.query.root != null ? Number(req.query.root) : null;
    if (requestedRoot != null && !index.personById.has(requestedRoot)) {
      res.status(404).json({ error: 'Không tìm thấy người này' });
      return;
    }
    const tree = buildTree(index, requestedRoot != null ? [requestedRoot] : roots);
    const included = new Set<number>();
    const collect = (nodes: TreeResponse['roots']) => {
      for (const n of nodes) {
        included.add(n.personId);
        for (const u of n.unions) {
          if (u.spouseId != null) included.add(u.spouseId);
          collect(u.children);
        }
      }
    };
    collect(tree);
    const persons: TreeResponse['persons'] = {};
    for (const id of included) {
      persons[id] = toPersonView(index.personById.get(id)!, viewer, visibility, generations.get(id) ?? null);
    }
    const body: TreeResponse = { roots: tree, persons };
    res.json(body);
  });

  app.get('/api/persons/:id', (req: Request, res: Response) => {
    const { index, generations, visibility } = snapshot(db);
    const id = Number(req.params.id);
    const person = index.personById.get(id);
    if (!person) {
      res.status(404).json({ error: 'Không tìm thấy người này' });
      return;
    }
    const body: PersonDetail = {
      person: toPersonView(person, viewerOf(req), visibility, generations.get(id) ?? null),
      parents: index.parentsOf(id),
      spouses: index.unionsOf(id)
        .filter((u) => index.spouseIn(u, id) != null)
        .map((u) => ({ personId: index.spouseIn(u, id)!, unionId: u.id, order: u.orderIndex })),
      children: index.unionsOf(id).flatMap((u) => index.childrenOf(u.id).map((pc) => ({ personId: pc.childId, kind: pc.kind }))),
    };
    res.json(body);
  });

  app.get('/api/search', (req: Request, res: Response) => {
    const { index, generations } = snapshot(db);
    res.json(searchPersons(index, generations, String(req.query.q ?? '')));
  });

  return app;
}
