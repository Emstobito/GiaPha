import type { TreeNode, TreeUnion } from '@giapha/shared';
import type { FamilyData, ParentChildRow, PersonRow, UnionRow } from './family.js';

/** Chỉ mục tra cứu quan hệ, dựng 1 lần từ FamilyData. */
export class FamilyIndex {
  readonly personById = new Map<number, PersonRow>();
  private readonly unionsByPartner = new Map<number, UnionRow[]>();
  private readonly childrenByUnion = new Map<number, ParentChildRow[]>();
  private readonly parentRowsByChild = new Map<number, ParentChildRow[]>();
  private readonly unionById = new Map<number, UnionRow>();

  constructor(data: FamilyData) {
    for (const p of data.persons) this.personById.set(p.id, p);
    for (const u of data.unions) {
      this.unionById.set(u.id, u);
      push(this.unionsByPartner, u.partner1Id, u);
      if (u.partner2Id != null) push(this.unionsByPartner, u.partner2Id, u);
    }
    for (const pc of data.parentChild) {
      push(this.childrenByUnion, pc.unionId, pc);
      push(this.parentRowsByChild, pc.childId, pc);
    }
    for (const list of this.unionsByPartner.values()) list.sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id);
    for (const list of this.childrenByUnion.values()) {
      list.sort((a, b) => (a.birthOrder ?? Infinity) - (b.birthOrder ?? Infinity) || a.childId - b.childId);
    }
  }

  unionsOf(personId: number): UnionRow[] {
    return this.unionsByPartner.get(personId) ?? [];
  }

  childrenOf(unionId: number): ParentChildRow[] {
    return this.childrenByUnion.get(unionId) ?? [];
  }

  parentRowsOf(childId: number): ParentChildRow[] {
    return this.parentRowsByChild.get(childId) ?? [];
  }

  parentsOf(childId: number): number[] {
    const ids: number[] = [];
    for (const pc of this.parentRowsOf(childId)) {
      const u = this.unionById.get(pc.unionId);
      if (!u) continue;
      ids.push(u.partner1Id);
      if (u.partner2Id != null) ids.push(u.partner2Id);
    }
    return [...new Set(ids)];
  }

  spouseIn(union: UnionRow, personId: number): number | null {
    return union.partner1Id === personId ? union.partner2Id : union.partner1Id;
  }

  /** Vị trí "chính" của 1 người trong cây: quan hệ ruột nếu có, không thì vị trí đầu tiên. Người ở nhiều
   *  vị trí (vd con nuôi mà cha mẹ ruột cũng trong dòng họ) chỉ bung con cháu ở vị trí chính. */
  primaryParentRow(childId: number): ParentChildRow | undefined {
    const rows = this.parentRowsOf(childId);
    return rows.find((r) => r.kind === 'biological') ?? rows[0];
  }

  hasParents(personId: number): boolean {
    return this.parentRowsOf(personId).length > 0;
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/**
 * Thuỷ tổ = người không có cha mẹ trong dữ liệu VÀ không phải người "dâu/rể" (lấy người trong dòng họ).
 * Cặp vợ chồng thuỷ tổ (cả 2 đều không có cha mẹ) → chỉ partner1 làm gốc, partner2 là vợ/chồng.
 */
export function findRoots(index: FamilyIndex): number[] {
  const roots: number[] = [];
  for (const person of index.personById.values()) {
    if (index.hasParents(person.id)) continue;
    const marriedIn = index.unionsOf(person.id).some((u) => {
      const other = index.spouseIn(u, person.id);
      if (other == null) return false;
      return index.hasParents(other) || u.partner2Id === person.id;
    });
    if (!marriedIn) roots.push(person.id);
  }
  return roots.sort((a, b) => a - b);
}

export function buildTree(index: FamilyIndex, rootIds: number[]): TreeNode[] {
  const expanded = new Set<number>();

  const nodeFor = (personId: number, row?: ParentChildRow): TreeNode => {
    const isPrimary = !row || index.primaryParentRow(personId) === row;
    if (!isPrimary || expanded.has(personId)) {
      return { personId, childKind: row?.kind, ref: true, unions: [] };
    }
    expanded.add(personId);
    const treeUnions: TreeUnion[] = index.unionsOf(personId).map((u) => ({
      unionId: u.id,
      spouseId: index.spouseIn(u, personId),
      order: u.orderIndex,
      children: index.childrenOf(u.id).map((pc) => nodeFor(pc.childId, pc)),
    }));
    return { personId, childKind: row?.kind, unions: treeUnions };
  };

  return rootIds.filter((id) => index.personById.has(id)).map((id) => nodeFor(id));
}

/** Đời: thuỷ tổ = 1, vợ/chồng cùng đời với người trong dòng họ, con = đời cha mẹ + 1 (theo vị trí chính). */
export function computeGenerations(index: FamilyIndex, roots: number[]): Map<number, number> {
  const gen = new Map<number, number>();
  const queue: number[] = [];
  for (const r of roots) {
    gen.set(r, 1);
    queue.push(r);
  }
  while (queue.length > 0) {
    const pid = queue.shift()!;
    const g = gen.get(pid)!;
    for (const u of index.unionsOf(pid)) {
      const spouse = index.spouseIn(u, pid);
      if (spouse != null && !gen.has(spouse)) {
        gen.set(spouse, g);
        queue.push(spouse);
      }
      for (const pc of index.childrenOf(u.id)) {
        if (gen.has(pc.childId) || index.primaryParentRow(pc.childId) !== pc) continue;
        gen.set(pc.childId, g + 1);
        queue.push(pc.childId);
      }
    }
  }
  return gen;
}

export function isAncestor(index: FamilyIndex, ancestorId: number, personId: number): boolean {
  const seen = new Set<number>();
  const stack = index.parentsOf(personId);
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === ancestorId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...index.parentsOf(id));
  }
  return false;
}

/** Gắn parentId làm cha/mẹ của childId có tạo vòng lặp tổ tiên không (tự làm cha mình, hoặc con cháu
 *  thành tổ tiên của chính mình). */
export function wouldCreateCycle(index: FamilyIndex, parentId: number, childId: number): boolean {
  return parentId === childId || isAncestor(index, childId, parentId);
}

/** Người thuộc nhánh = người gốc, con cháu (ruột lẫn nuôi) của người gốc, và vợ/chồng của những người đó. */
export function branchMembers(index: FamilyIndex, rootPersonId: number): Set<number> {
  const blood = new Set<number>();
  const stack = [rootPersonId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (blood.has(id)) continue;
    blood.add(id);
    for (const u of index.unionsOf(id)) {
      for (const pc of index.childrenOf(u.id)) stack.push(pc.childId);
    }
  }
  const members = new Set(blood);
  for (const id of blood) {
    for (const u of index.unionsOf(id)) {
      const spouse = index.spouseIn(u, id);
      if (spouse != null) members.add(spouse);
    }
  }
  return members;
}
