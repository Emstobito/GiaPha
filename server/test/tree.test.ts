import { describe, expect, it } from 'vitest';
import type { TreeNode } from '@giapha/shared';
import { branchMembers, buildTree, isAncestor, wouldCreateCycle } from '../src/domain/tree.js';
import { sampleIndex } from './helpers.js';

function find(nodes: TreeNode[], personId: number, out: TreeNode[] = []): TreeNode[] {
  for (const n of nodes) {
    if (n.personId === personId) out.push(n);
    for (const u of n.unions) find(u.children, personId, out);
  }
  return out;
}

describe('thuỷ tổ & đời', () => {
  it('chỉ thuỷ tổ là gốc — vợ thuỷ tổ và người dâu/rể không bị coi là gốc', () => {
    const { roots, ids } = sampleIndex();
    expect(roots).toEqual([ids.to]);
  });

  it('tính đúng đời, vợ/chồng cùng đời với người trong họ', () => {
    const { generations: g, ids } = sampleIndex();
    expect(g.get(ids.to)).toBe(1);
    expect(g.get(ids.toVo)).toBe(1);
    expect(g.get(ids.ca)).toBe(2);
    expect(g.get(ids.haiChong)).toBe(2);
    expect(g.get(ids.ba)).toBe(3);
    expect(g.get(ids.nam)).toBe(4);
    expect(g.get(ids.namVo)).toBe(4);
    expect(g.get(ids.ut)).toBe(5);
    expect(g.get(ids.tam)).toBe(5);
  });
});

describe('dựng cây', () => {
  it('người nhiều đời vợ: các union xếp theo thứ tự vợ cả, vợ hai', () => {
    const { index, roots, ids } = sampleIndex();
    const [ca] = find(buildTree(index, roots), ids.ca);
    expect(ca?.unions.map((u) => [u.spouseId, u.order])).toEqual([[ids.caVoCa, 1], [ids.caVoHai, 2]]);
  });

  it('con xếp theo thứ tự sinh; cha đơn thân có union không vợ/chồng', () => {
    const { index, roots, ids } = sampleIndex();
    const tree = buildTree(index, roots);
    const [to] = find(tree, ids.to);
    expect(to?.unions[0]?.children.map((c) => c.personId)).toEqual([ids.ca, ids.hai]);
    const [bay] = find(tree, ids.bay);
    expect(bay?.unions[0]?.spouseId).toBeNull();
    expect(bay?.unions[0]?.children.map((c) => c.personId)).toEqual([ids.tam]);
  });

  it('con nuôi có cha mẹ ruột trong họ: bung con cháu ở vị trí ruột, vị trí nuôi chỉ là tham chiếu', () => {
    const { index, roots, ids } = sampleIndex();
    const places = find(buildTree(index, roots), ids.nuoi);
    expect(places).toHaveLength(2);
    expect(places.find((p) => p.childKind === 'biological')?.ref).toBeUndefined();
    expect(places.find((p) => p.childKind === 'adopted')).toMatchObject({ ref: true, unions: [] });
  });

  it('dựng cây từ 1 người gốc bất kỳ (xem 1 nhánh)', () => {
    const { index, ids } = sampleIndex();
    const [ba] = buildTree(index, [ids.ba]);
    expect(ba?.personId).toBe(ids.ba);
    expect(find([ba!], ids.ut)).toHaveLength(1);
    expect(find([ba!], ids.bay)).toHaveLength(0);
  });
});

describe('chống vòng lặp tổ tiên', () => {
  it('phát hiện tổ tiên', () => {
    const { index, ids } = sampleIndex();
    expect(isAncestor(index, ids.to, ids.ut)).toBe(true);
    expect(isAncestor(index, ids.ut, ids.to)).toBe(false);
    expect(isAncestor(index, ids.tu, ids.nam)).toBe(false);
  });

  it('không cho cháu làm cha/mẹ của tổ tiên, không cho tự làm cha mình', () => {
    const { index, ids } = sampleIndex();
    expect(wouldCreateCycle(index, ids.ut, ids.to)).toBe(true);
    expect(wouldCreateCycle(index, ids.nam, ids.nam)).toBe(true);
    expect(wouldCreateCycle(index, ids.bay, ids.ut)).toBe(false);
  });
});

describe('thành viên chi/nhánh (phạm vi quyền sửa)', () => {
  it('gồm người gốc, con cháu và vợ/chồng của họ; không gồm nhánh khác', () => {
    const { index, ids } = sampleIndex();
    const chiTruong = branchMembers(index, ids.ba);
    for (const id of [ids.ba, ids.baVo, ids.nam, ids.namVo, ids.sau, ids.ut]) expect(chiTruong.has(id)).toBe(true);
    for (const id of [ids.ca, ids.tu, ids.bay, ids.tam, ids.nuoi]) expect(chiTruong.has(id)).toBe(false);
  });
});
