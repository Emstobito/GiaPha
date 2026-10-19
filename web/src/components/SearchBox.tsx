import { useEffect, useRef, useState } from 'react';
import type { SearchHit } from '@giapha/shared';
import { api } from '../api';
import { SearchIcon } from './icons';

export function SearchBox({ onPick }: { onPick: (personId: number) => void }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api.search(q).then((r) => {
        if (cancelled) return;
        setHits(r);
        setActive(0);
      }).catch(() => !cancelled && setHits([]));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Phím "/" ở bất kỳ đâu (trừ khi đang gõ trong ô nhập khác) → nhảy vào ô tìm kiếm.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (h: SearchHit) => {
    onPick(h.id);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="search-box">
      <SearchIcon className="search-icon" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Tìm người trong dòng họ…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && hits[active]) pick(hits[active]);
          if (e.key === 'Escape') inputRef.current?.blur();
        }}
        aria-label="Tìm người trong gia phả"
      />
      <kbd className="search-kbd">/</kbd>
      {open && query.trim() && (
        <ul className="search-results">
          {hits.length === 0 && <li className="empty">Không tìm thấy ai phù hợp</li>}
          {hits.map((h, i) => (
            <li key={h.id}>
              <button type="button" className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onClick={() => pick(h)}>
                <span>{h.fullName}</span>
                {h.generation != null && <small>Đời {h.generation}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
