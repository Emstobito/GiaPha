import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy';
import type { ChildKind, TreeNode, TreeUnion } from '@giapha/shared';

export const PERSON_W = 196;
export const PERSON_H = 72;
/** Khoảng nối giữa 2 vợ chồng (vòng ⚭). */
export const LINK_W = 34;
export const REF_W = 168;
export const H_GAP = 36;
export const LEVEL_GAP = 168;

export type CardSlot =
  | { type: 'person'; personId: number; isSelf: boolean; x: number }
  | { type: 'link'; union: TreeUnion; x: number };

export interface CardSlots {
  slots: CardSlot[];
  width: number;
  /** Tâm ô của người trong họ — đường nối từ cha mẹ đi vào đây. */
  selfCenterX: number;
  /** Vị trí x (so với mép trái ô) mà đường nối xuống con của từng hôn nhân đi ra. */
  unionHandleX: Map<number, number>;
}

/**
 * Thứ tự trong 1 ô gia đình — nơi DUY NHẤT quyết định vị trí, dùng chung cho bố cục và cho phần vẽ.
 * Nhiều vợ/chồng: người thứ nhất bên trái, người trong họ ở giữa, những người sau bên phải (cách trình
 * bày gia phả truyền thống). Đường xuống con đi ra từ vòng nối của đúng cặp đó; cha/mẹ đơn thân đi ra từ
 * chính người đó.
 */
export function cardSlots(t: TreeNode): CardSlots {
  const spouseUnions = t.unions.filter((u) => u.spouseId != null);
  const left = spouseUnions.length >= 2 ? spouseUnions.slice(0, 1) : [];
  const right = spouseUnions.length >= 2 ? spouseUnions.slice(1) : spouseUnions;

  const slots: CardSlot[] = [];
  let x = 0;
  const person = (personId: number, isSelf: boolean) => {
    slots.push({ type: 'person', personId, isSelf, x });
    x += PERSON_W;
  };
  const link = (union: TreeUnion) => {
    slots.push({ type: 'link', union, x });
    x += LINK_W;
  };

  for (const u of left) {
    person(u.spouseId!, false);
    link(u);
  }
  const selfX = x;
  person(t.personId, true);
  for (const u of right) {
    link(u);
    person(u.spouseId!, false);
  }

  const unionHandleX = new Map<number, number>();
  for (const s of slots) if (s.type === 'link') unionHandleX.set(s.union.unionId, s.x + LINK_W / 2);
  for (const u of t.unions) if (u.spouseId == null) unionHandleX.set(u.unionId, selfX + PERSON_W / 2);

  return { slots, width: x, selfCenterX: selfX + PERSON_W / 2, unionHandleX };
}

/** Mỗi ô trên cây = 1 người trong họ + các vợ/chồng xếp cạnh nhau (tạm gọi "ô gia đình"). */
export interface LayoutNode {
  /** Đường đi từ gốc (vd "1/3/12") — 1 người có thể hiện ở 2 chỗ (ô tham chiếu) nên id người không đủ. */
  key: string;
  tree: TreeNode;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  /** Tổng số người con cháu bên dưới (kể cả đang thu gọn) — hiện trên nút "+N". */
  descendantCount: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  /** Handle "u-<unionId>" dưới đúng cặp vợ chồng sinh ra người con này. */
  sourceHandle: string;
  target: string;
  kind: ChildKind;
}

interface Datum {
  key: string;
  tree: TreeNode | null;
  fromUnionId: number | null;
  children: Datum[];
}

export function nodeWidth(t: TreeNode): number {
  return t.ref ? REF_W : cardSlots(t).width;
}

function toDatum(t: TreeNode, parentKey: string, fromUnionId: number | null): Datum {
  const key = parentKey ? `${parentKey}/${t.personId}` : String(t.personId);
  return {
    key,
    tree: t,
    fromUnionId,
    children: t.unions.flatMap((u) => u.children.map((c) => toDatum(c, key, u.unionId))),
  };
}

function countDescendants(d: Datum): number {
  return d.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

/** Bố cục trên→dưới. Ô rộng khác nhau (nhiều vợ/chồng) → khoảng cách giữa 2 ô kề nhau tính theo độ rộng
 *  thật của chúng (separation), để không ô nào đè lên ô khác. */
export function layoutTree(roots: TreeNode[], collapsed: ReadonlySet<string>): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const superRoot: Datum = { key: '', tree: null, fromUnionId: null, children: roots.map((r) => toDatum(r, '', null)) };
  const width = (d: Datum) => (d.tree ? nodeWidth(d.tree) : 0);

  const root = hierarchy(superRoot, (d) => (d.tree && collapsed.has(d.key) ? [] : d.children));
  const laid = tree<Datum>()
    .nodeSize([1, LEVEL_GAP])
    .separation((a, b) => width(a.data) / 2 + width(b.data) / 2 + (a.parent === b.parent ? H_GAP : H_GAP * 2))(root);

  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  laid.each((n: HierarchyPointNode<Datum>) => {
    const d = n.data;
    if (!d.tree) return;
    const w = width(d);
    nodes.push({
      key: d.key,
      tree: d.tree,
      depth: n.depth,
      x: n.x - w / 2,
      y: (n.depth - 1) * LEVEL_GAP,
      width: w,
      height: PERSON_H,
      collapsed: collapsed.has(d.key) && d.children.length > 0,
      descendantCount: countDescendants(d),
    });
    if (n.parent?.data.tree && d.fromUnionId != null) {
      edges.push({
        id: `${n.parent.data.key}->${d.key}`,
        source: n.parent.data.key,
        sourceHandle: `u-${d.fromUnionId}`,
        target: d.key,
        kind: d.tree.childKind ?? 'biological',
      });
    }
  });
  return { nodes, edges };
}

/** Key của ô CHÍNH (không phải ô tham chiếu) của 1 người — dùng để nhảy tới khi tìm kiếm. */
export function findPrimaryKey(roots: TreeNode[], personId: number): string | null {
  const walk = (t: TreeNode, parentKey: string): string | null => {
    const key = parentKey ? `${parentKey}/${t.personId}` : String(t.personId);
    if (t.personId === personId && !t.ref) return key;
    for (const u of t.unions) {
      if (u.spouseId === personId) return key;
      for (const c of u.children) {
        const found = walk(c, key);
        if (found) return found;
      }
    }
    return null;
  };
  for (const r of roots) {
    const found = walk(r, '');
    if (found) return found;
  }
  return null;
}

/** Các key tổ tiên của 1 ô (để mở hết các nhánh đang thu gọn trên đường tới nó). */
export function ancestorKeys(key: string): string[] {
  const parts = key.split('/');
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
}

/** Key mọi ô có con ở đúng tầng `depth` (1 = thuỷ tổ) — thu gọn chúng = "chỉ hiện tới đời depth". */
export function keysWithChildrenAtDepth(roots: TreeNode[], depth: number): string[] {
  const out: string[] = [];
  const walk = (t: TreeNode, parentKey: string, d: number) => {
    const key = parentKey ? `${parentKey}/${t.personId}` : String(t.personId);
    const hasChildren = t.unions.some((u) => u.children.length > 0);
    if (d === depth) {
      if (hasChildren) out.push(key);
      return;
    }
    for (const u of t.unions) for (const c of u.children) walk(c, key, d + 1);
  };
  for (const r of roots) walk(r, '', 1);
  return out;
}

/** Số tầng sâu nhất của cây (để biết có bao nhiêu đời cho bộ lọc "hiện tới đời N"). */
export function maxDepth(roots: TreeNode[]): number {
  const walk = (t: TreeNode): number => 1 + Math.max(0, ...t.unions.flatMap((u) => u.children.map(walk)));
  return Math.max(0, ...roots.map(walk));
}
