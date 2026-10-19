import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { TreeResponse } from '@giapha/shared';
import { api } from './api';
import { DetailPanel } from './components/DetailPanel';
import { FamilyTree } from './components/FamilyTree';
import { TreeLogo } from './components/icons';
import { SearchBox } from './components/SearchBox';
import { maxDepth } from './layout';

function useColorMode(): 'light' | 'dark' {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return dark ? 'dark' : 'light';
}

export function App() {
  const [data, setData] = useState<TreeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ personId: number; seq: number } | null>(null);
  const colorMode = useColorMode();

  useEffect(() => {
    api.tree().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  const focus = useCallback((personId: number) => {
    setFocusRequest((prev) => ({ personId, seq: (prev?.seq ?? 0) + 1 }));
  }, []);
  const closePanel = useCallback(() => setSelected(null), []);

  const stats = useMemo(
    () => (data ? { people: Object.keys(data.persons).length, generations: maxDepth(data.roots) } : null),
    [data],
  );

  return (
    <div className="app" data-theme={colorMode}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo"><TreeLogo width={26} height={26} /></span>
          <div>
            <h1>Gia phả dòng họ</h1>
            {stats && <p className="brand-sub">{stats.people} thành viên · {stats.generations} đời</p>}
          </div>
        </div>
        <SearchBox onPick={focus} />
      </header>
      <main className="canvas">
        {error && <div className="state-msg error">Không tải được gia phả: {error}</div>}
        {!data && !error && <div className="state-msg"><span className="spinner" /> Đang tải gia phả…</div>}
        {data && data.roots.length === 0 && <div className="state-msg">Gia phả chưa có ai.</div>}
        {data && data.roots.length > 0 && (
          <ReactFlowProvider>
            <FamilyTree data={data} selectedPersonId={selected} onSelect={setSelected} focusRequest={focusRequest} colorMode={colorMode} />
          </ReactFlowProvider>
        )}
        {data && selected != null && (
          <DetailPanel key={selected} personId={selected} persons={data.persons} onClose={closePanel} onNavigate={focus} />
        )}
      </main>
    </div>
  );
}
