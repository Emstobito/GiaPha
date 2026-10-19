import { describe, expect, it } from 'vitest';
import type { TreeNode } from '@giapha/shared';
import {
  ancestorKeys, cardSlots, findPrimaryKey, keysWithChildrenAtDepth, layoutTree, LEVEL_GAP, LINK_W, maxDepth, nodeWidth,
  PERSON_W, REF_W,
} from '../src/layout';

// Cây giả: 1 (2 vợ: 2, 3) → con 4 (vợ cả), 5 (vợ hai); 4 (đơn thân) → con 6; 7 = con nuôi tham chiếu của 1.
const tree: TreeNode[] = [
  {
    personId: 1,
    unions: [
      { unionId: 10, spouseId: 2, order: 1, children: [
        { personId: 4, unions: [{ unionId: 11, spouseId: null, order: 1, children: [{ personId: 6, unions: [] }] }] },
        { personId: 7, childKind: 'adopted', ref: true, unions: [] },
      ] },
      { unionId: 12, spouseId: 3, order: 2, children: [{ personId: 5, unions: [] }] },
    ],
  },
];

describe('cấu trúc 1 ô gia đình', () => {
  it('2 vợ: vợ cả bên trái, chồng giữa, vợ hai bên phải; đường xuống con đi ra từ vòng nối của đúng cặp', () => {
    const s = cardSlots(tree[0]!);
    expect(s.slots.map((x) => (x.type === 'person' ? `p${x.personId}` : `l${x.union.unionId}`))).toEqual(['p2', 'l10', 'p1', 'l12', 'p3']);
    expect(s.width).toBe(PERSON_W * 3 + LINK_W * 2);
    expect(s.selfCenterX).toBe(PERSON_W + LINK_W + PERSON_W / 2);
    expect(s.unionHandleX.get(10)).toBe(PERSON_W + LINK_W / 2);
    expect(s.unionHandleX.get(12)).toBe(PERSON_W * 2 + LINK_W + LINK_W / 2);
  });

  it('1 vợ: chồng trái, vợ phải; cha/mẹ đơn thân: đường đi ra từ chính người đó', () => {
    const couple = cardSlots({ personId: 1, unions: [{ unionId: 10, spouseId: 2, order: 1, children: [] }] });
    expect(couple.slots.map((x) => x.type)).toEqual(['person', 'link', 'person']);
    expect(couple.selfCenterX).toBe(PERSON_W / 2);
    const single = cardSlots(tree[0]!.unions[0]!.children[0]!);
    expect(single.width).toBe(PERSON_W);
    expect(single.unionHandleX.get(11)).toBe(PERSON_W / 2);
  });

  it('ô tham chiếu hẹp hơn', () => {
    expect(nodeWidth({ personId: 7, ref: true, unions: [] })).toBe(REF_W);
  });
});

describe('bố cục cây', () => {
  it('mỗi đời 1 tầng, thuỷ tổ ở trên cùng', () => {
    const { nodes } = layoutTree(tree, new Set());
    const y = Object.fromEntries(nodes.map((n) => [n.key, n.y]));
    expect(y['1']).toBe(0);
    expect(y['1/4']).toBe(LEVEL_GAP);
    expect(y['1/5']).toBe(LEVEL_GAP);
    expect(y['1/4/6']).toBe(LEVEL_GAP * 2);
  });

  it('không ô nào đè lên ô khác cùng tầng', () => {
    const { nodes } = layoutTree(tree, new Set());
    const byY = new Map<number, typeof nodes>();
    for (const n of nodes) byY.set(n.y, [...(byY.get(n.y) ?? []), n]);
    for (const row of byY.values()) {
      const sorted = [...row].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]!.x).toBeGreaterThanOrEqual(sorted[i - 1]!.x + sorted[i - 1]!.width);
      }
    }
  });

  it('đường nối đi từ đúng cặp vợ chồng sinh ra con; con nuôi đánh dấu', () => {
    const { edges } = layoutTree(tree, new Set());
    expect(edges.find((e) => e.target === '1/4')).toMatchObject({ source: '1', sourceHandle: 'u-10', kind: 'biological' });
    expect(edges.find((e) => e.target === '1/5')).toMatchObject({ sourceHandle: 'u-12' });
    expect(edges.find((e) => e.target === '1/7')).toMatchObject({ kind: 'adopted' });
  });

  it('thu gọn: ẩn con cháu, ô vẫn biết số người bên dưới', () => {
    const { nodes } = layoutTree(tree, new Set(['1']));
    expect(nodes.map((n) => n.key)).toEqual(['1']);
    expect(nodes[0]).toMatchObject({ collapsed: true, descendantCount: 4 });
  });
});

describe('điều hướng & lọc theo đời', () => {
  it('tìm ô chính (bỏ qua ô tham chiếu) và vợ/chồng nằm trong ô của chồng/vợ', () => {
    expect(findPrimaryKey(tree, 6)).toBe('1/4/6');
    expect(findPrimaryKey(tree, 3)).toBe('1');
    expect(findPrimaryKey(tree, 7)).toBeNull();
    expect(findPrimaryKey(tree, 99)).toBeNull();
  });

  it('liệt kê các ô tổ tiên cần mở', () => {
    expect(ancestorKeys('1/4/6')).toEqual(['1', '1/4']);
    expect(ancestorKeys('1')).toEqual([]);
  });

  it('"hiện tới đời N" = thu gọn mọi ô có con ở đời N', () => {
    expect(maxDepth(tree)).toBe(3);
    expect(keysWithChildrenAtDepth(tree, 1)).toEqual(['1']);
    expect(keysWithChildrenAtDepth(tree, 2)).toEqual(['1/4']);
    expect(keysWithChildrenAtDepth(tree, 3)).toEqual([]);
  });
});
