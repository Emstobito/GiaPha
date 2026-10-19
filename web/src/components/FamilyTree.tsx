import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow, useReactFlow, type Edge, type Node } from '@xyflow/react';
import type { TreeResponse } from '@giapha/shared';
import {
  ancestorKeys, findPrimaryKey, keysWithChildrenAtDepth, layoutTree, maxDepth, PERSON_H, PERSON_W,
} from '../layout';
import { FamilyCard, GenerationLabel, type FamilyCardNode, type GenLabelNode } from './FamilyCard';
import { ExpandIcon, FitIcon, MinusIcon, PlusIcon } from './icons';

const nodeTypes = { family: FamilyCard, gen: GenerationLabel };
const GEN_LABEL_W = 64;

interface Props {
  data: TreeResponse;
  selectedPersonId: number | null;
  onSelect: (personId: number) => void;
  /** Đổi giá trị (vd thêm bộ đếm) để yêu cầu cây nhảy tới người đang chọn. */
  focusRequest: { personId: number; seq: number } | null;
  colorMode: 'light' | 'dark';
}

export function FamilyTree({ data, selectedPersonId, onSelect, focusRequest, colorMode }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const flow = useReactFlow();
  const depthCount = useMemo(() => maxDepth(data.roots), [data.roots]);

  const toggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const refit = useCallback(() => setTimeout(() => flow.fitView({ duration: 400, padding: 0.15 }), 30), [flow]);

  const showUntil = useCallback(
    (depth: number | null) => {
      setCollapsed(depth == null ? new Set() : new Set(keysWithChildrenAtDepth(data.roots, depth)));
      refit();
    },
    [data.roots, refit],
  );

  const goTo = useCallback(
    (personId: number) => {
      const key = findPrimaryKey(data.roots, personId);
      if (!key) return;
      setCollapsed((prev) => {
        const next = new Set(prev);
        for (const a of ancestorKeys(key)) next.delete(a);
        return next;
      });
      onSelect(personId);
      // Chờ React Flow vẽ lại sau khi mở nhánh rồi mới căn giữa vào ô đó.
      setTimeout(() => {
        const n = flow.getNode(key);
        if (n) flow.setCenter(n.position.x + (n.width ?? PERSON_W) / 2, n.position.y + PERSON_H / 2, { zoom: 1.1, duration: 600 });
      }, 50);
    },
    [data.roots, flow, onSelect],
  );

  useEffect(() => {
    if (focusRequest) goTo(focusRequest.personId);
  }, [focusRequest, goTo]);

  const { nodes, edges } = useMemo(() => {
    const laid = layoutTree(data.roots, collapsed);
    const familyNodes: FamilyCardNode[] = laid.nodes.map((n) => ({
      id: n.key,
      type: 'family',
      position: { x: n.x, y: n.y },
      width: n.width,
      height: n.height,
      draggable: false,
      selectable: false,
      // Ô không kéo/chọn được thì React Flow tự đặt pointer-events:none → không bấm được nút bên trong.
      style: { pointerEvents: 'all' },
      data: {
        tree: n.tree,
        persons: data.persons,
        collapsed: n.collapsed,
        descendantCount: n.descendantCount,
        hasChildren: n.descendantCount > 0,
        selectedPersonId,
        onSelect,
        onToggle: () => toggle(n.key),
        onGoToPrimary: goTo,
      },
    }));

    // Dải nhãn "Đời N" bên trái, mỗi tầng 1 nhãn — số đời lấy từ API (đúng cả khi xem 1 nhánh).
    const minX = Math.min(...laid.nodes.map((n) => n.x));
    const rows = new Map<number, number>();
    for (const n of laid.nodes) {
      if (!rows.has(n.y)) rows.set(n.y, data.persons[n.tree.personId]?.generation ?? n.depth);
    }
    const labelNodes: GenLabelNode[] = [...rows].map(([y, generation]) => ({
      id: `gen-${y}`,
      type: 'gen',
      position: { x: minX - GEN_LABEL_W - 40, y },
      width: GEN_LABEL_W,
      height: PERSON_H,
      draggable: false,
      selectable: false,
      data: { generation },
    }));

    const edges: Edge[] = laid.edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      type: 'smoothstep',
      pathOptions: { borderRadius: 18 },
      className: e.kind === 'adopted' ? 'edge-adopted' : 'edge-bio',
    }));
    return { nodes: [...labelNodes, ...familyNodes] as Node[], edges };
  }, [data, collapsed, selectedPersonId, onSelect, toggle, goTo]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      colorMode={colorMode}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.05}
      maxZoom={2}
      onlyRenderVisibleElements
      nodesConnectable={false}
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1.4} />
      <MiniMap pannable zoomable className="minimap" nodeBorderRadius={8} maskColor="var(--minimap-mask)" />
      <Panel position="bottom-center" className="toolbar">
        <button type="button" onClick={() => flow.zoomOut({ duration: 200 })} title="Thu nhỏ" aria-label="Thu nhỏ"><MinusIcon /></button>
        <button type="button" onClick={() => flow.zoomIn({ duration: 200 })} title="Phóng to" aria-label="Phóng to"><PlusIcon /></button>
        <button type="button" onClick={refit} title="Vừa màn hình" aria-label="Vừa màn hình"><FitIcon /></button>
        <span className="toolbar-sep" />
        <button type="button" className="with-text" onClick={() => showUntil(null)} title="Mở tất cả các nhánh">
          <ExpandIcon /> Mở tất cả
        </button>
        <label className="toolbar-select">
          Hiện tới
          <select
            defaultValue=""
            onChange={(e) => showUntil(e.target.value ? Number(e.target.value) : null)}
            aria-label="Chỉ hiện tới đời"
          >
            <option value="">mọi đời</option>
            {Array.from({ length: Math.max(0, depthCount - 1) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>đời {d}</option>
            ))}
          </select>
        </label>
      </Panel>
      <Panel position="bottom-left" className="legend">
        <span><i className="dot dot-male" /> Nam</span>
        <span><i className="dot dot-female" /> Nữ</span>
        <span><i className="dot dot-dead" /> Đã mất</span>
        <span><i className="line line-adopted" /> Con nuôi</span>
      </Panel>
    </ReactFlow>
  );
}
