import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { PersonView, TreeNode } from '@giapha/shared';
import { lifeSpan } from '../format';
import { cardSlots, LINK_W, PERSON_H, PERSON_W, REF_W } from '../layout';
import { Avatar } from './Avatar';
import { LockIcon } from './icons';

export interface FamilyCardData extends Record<string, unknown> {
  tree: TreeNode;
  persons: Record<number, PersonView>;
  collapsed: boolean;
  descendantCount: number;
  hasChildren: boolean;
  selectedPersonId: number | null;
  onSelect: (personId: number) => void;
  onToggle: () => void;
  onGoToPrimary: (personId: number) => void;
}

export type FamilyCardNode = Node<FamilyCardData, 'family'>;

function PersonTile({ person, isSelf, selected, onSelect }: {
  person: PersonView | undefined;
  isSelf: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  if (!person) return <div className="tile" style={{ width: PERSON_W, height: PERSON_H }}>?</div>;
  const span = lifeSpan(person);
  return (
    <button
      type="button"
      className={`tile tile-${person.gender}${person.isLiving ? '' : ' tile-dead'}${isSelf ? ' tile-self' : ' tile-spouse'}${selected ? ' tile-selected' : ''}`}
      style={{ width: PERSON_W, height: PERSON_H }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      title={person.fullName}
    >
      <Avatar person={person} size={40} />
      <span className="tile-text">
        <span className="tile-name">{person.fullName}</span>
        <span className="tile-meta">
          {span ?? (person.isLiving ? 'Còn sống' : 'Đã mất')}
          {person.detailsHidden && <LockIcon width={12} height={12} className="tile-lock" />}
        </span>
      </span>
    </button>
  );
}

export function FamilyCard({ data }: NodeProps<FamilyCardNode>) {
  const { tree, persons, selectedPersonId, onSelect } = data;
  const self = persons[tree.personId];

  if (tree.ref) {
    return (
      <div className={`ref-card${tree.childKind === 'adopted' ? ' ref-adopted' : ''}`} style={{ width: REF_W, height: PERSON_H }}>
        <Handle type="target" position={Position.Top} isConnectable={false} />
        <button type="button" onClick={() => data.onGoToPrimary(tree.personId)}>
          <span className="ref-name">{self?.fullName ?? '?'}</span>
          <span className="ref-hint">{tree.childKind === 'adopted' ? 'Con nuôi · ' : ''}xem ở nhánh chính →</span>
        </button>
      </div>
    );
  }

  const layout = cardSlots(tree);
  const multi = layout.slots.filter((s) => s.type === 'link').length > 1;
  return (
    <div className="family-card" style={{ width: layout.width }}>
      <Handle type="target" position={Position.Top} style={{ left: layout.selfCenterX }} isConnectable={false} />
      <div className="family-row">
        {layout.slots.map((s) =>
          s.type === 'person' ? (
            <PersonTile
              key={`p-${s.personId}`}
              person={persons[s.personId]}
              isSelf={s.isSelf}
              selected={selectedPersonId === s.personId}
              onSelect={() => onSelect(s.personId)}
            />
          ) : (
            <span key={`l-${s.union.unionId}`} className="union-link" style={{ width: LINK_W }} title={multi ? `Hôn nhân thứ ${s.union.order}` : 'Vợ chồng'}>
              <span className="union-ring">{multi ? s.union.order : '⚭'}</span>
            </span>
          ),
        )}
      </div>
      {tree.unions.map((u) => (
        <Handle
          key={u.unionId}
          id={`u-${u.unionId}`}
          type="source"
          position={Position.Bottom}
          style={{ left: layout.unionHandleX.get(u.unionId) }}
          isConnectable={false}
        />
      ))}
      {data.hasChildren && (
        <button
          type="button"
          className={`toggle-btn${data.collapsed ? ' is-collapsed' : ''}`}
          style={{ left: layout.selfCenterX }}
          onClick={data.onToggle}
          title={data.collapsed ? `Mở nhánh (${data.descendantCount} người)` : 'Thu gọn nhánh'}
        >
          {data.collapsed ? `+${data.descendantCount}` : '−'}
        </button>
      )}
    </div>
  );
}

export interface GenLabelData extends Record<string, unknown> {
  generation: number;
}
export type GenLabelNode = Node<GenLabelData, 'gen'>;

export function GenerationLabel({ data }: NodeProps<GenLabelNode>) {
  return (
    <div className="gen-label" style={{ height: PERSON_H }}>
      <span className="gen-small">Đời</span>
      <span className="gen-num">{data.generation}</span>
    </div>
  );
}
