import { useEffect, useState, type ReactNode } from 'react';
import type { PersonDetail, PersonView } from '@giapha/shared';
import { api } from '../api';
import { formatDate } from '../format';
import { Avatar } from './Avatar';
import { CalendarIcon, CloseIcon, IncenseIcon, LockIcon, NoteIcon, PhoneIcon, PinIcon, TagIcon } from './icons';

interface Props {
  personId: number;
  persons: Record<number, PersonView>;
  onClose: () => void;
  onNavigate: (personId: number) => void;
}

const GENDER = { male: 'Nam', female: 'Nữ', unknown: 'Không rõ' } as const;

export function DetailPanel({ personId, persons, onClose, onNavigate }: Props) {
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    api.person(personId).then((d) => !cancelled && setDetail(d)).catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [personId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const p = detail?.person ?? persons[personId];

  const relative = (id: number, note?: string) => (
    <li key={`${id}-${note ?? ''}`}>
      <button type="button" className="relative-chip" onClick={() => onNavigate(id)}>
        <Avatar person={persons[id]} size={26} />
        <span>{persons[id]?.fullName ?? `#${id}`}</span>
        {note && <small>{note}</small>}
      </button>
    </li>
  );

  // Chỉ hiện dòng nào máy chủ có gửi — trường bị ẩn với người xem hiện tại không có trong dữ liệu.
  const info: [ReactNode, string, string | null | undefined][] = detail
    ? [
        [<TagIcon key="i" />, 'Tên khác', detail.person.otherNames],
        [<CalendarIcon key="i" />, 'Ngày sinh', formatDate(detail.person.birthDate)],
        [<PinIcon key="i" />, 'Nơi sinh', detail.person.birthPlace],
        [<IncenseIcon key="i" />, detail.person.deathDate?.lunar ? 'Ngày giỗ' : 'Ngày mất', formatDate(detail.person.deathDate)],
        [<PhoneIcon key="i" />, 'Liên hệ', detail.person.contact],
        [<NoteIcon key="i" />, 'Ghi chú', detail.person.notes],
      ]
    : [];
  const shownInfo = info.filter(([, , v]) => v);

  return (
    <aside className="detail-panel" aria-label="Thông tin chi tiết">
      <button type="button" className="icon-btn close" onClick={onClose} aria-label="Đóng"><CloseIcon /></button>
      {error && <p className="error">Không tải được: {error}</p>}
      {p && (
        <header className={`detail-hero hero-${p.gender}`}>
          <Avatar person={p} size={64} />
          <div>
            <h2>{p.fullName}</h2>
            <div className="chips">
              <span className="chip">{GENDER[p.gender]}</span>
              {p.generation != null && <span className="chip chip-accent">Đời {p.generation}</span>}
              <span className={`chip ${p.isLiving ? 'chip-living' : 'chip-dead'}`}>{p.isLiving ? 'Còn sống' : 'Đã mất'}</span>
            </div>
          </div>
        </header>
      )}
      {!detail && !error && <div className="skeleton" aria-label="Đang tải" />}
      {detail && (
        <div className="detail-body">
          {detail.person.detailsHidden && (
            <p className="notice"><LockIcon width={16} height={16} /> Thông tin chi tiết của người này không công khai.</p>
          )}
          {shownInfo.length > 0 && (
            <dl className="info-list">
              {shownInfo.map(([icon, label, v]) => (
                <div key={label}>
                  <dt>{icon}{label}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {detail.parents.length > 0 && (
            <section>
              <h3>Cha mẹ</h3>
              <ul className="relatives">{detail.parents.map((id) => relative(id))}</ul>
            </section>
          )}
          {detail.spouses.length > 0 && (
            <section>
              <h3>Vợ / chồng</h3>
              <ul className="relatives">
                {detail.spouses.map((s) => relative(s.personId, detail.spouses.length > 1 ? (s.order === 1 ? 'cả' : `thứ ${s.order}`) : undefined))}
              </ul>
            </section>
          )}
          {detail.children.length > 0 && (
            <section>
              <h3>Con ({detail.children.length})</h3>
              <ul className="relatives">{detail.children.map((c) => relative(c.personId, c.kind === 'adopted' ? 'con nuôi' : undefined))}</ul>
            </section>
          )}
        </div>
      )}
    </aside>
  );
}
