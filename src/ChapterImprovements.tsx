import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Smartphone, X } from 'lucide-react';
import './chapter-improvements.css';

const documents = import.meta.glob<string>('../docs/plans/*.md', {
  query: '?raw', import: 'default', eager: true,
});
const overview = '../docs/plans/improvements.md';

function documentTitle(path: string) {
  return documents[path].split('\n')[0].replace(/^#+\s*/, '');
}

export default function ChapterImprovements({ onClose }: { onClose: () => void }) {
  const [path, setPath] = useState(overview);
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => { content.current?.scrollTo(0, 0); }, [path]);

  function inline(text: string): ReactNode {
    return text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const target = '../docs/plans/' + link[2];
        return documents[target]
          ? <button key={index} className="plan-link" onClick={() => setPath(target)}>{link[1]}</button>
          : <span key={index}>{link[1]}</span>;
      }
      if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
      return part;
    });
  }

  return <dialog ref={dialog} className="modal improvements-modal" aria-label="Улучшения глав" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="rotate-screen" role="status"><Smartphone size={54} /><h1>Поверните телефон</h1><p>Список улучшений читается горизонтально.</p></div>
    <header><h2>Улучшения глав</h2><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X /></button></header>
    <label className="improvements-select">Список или подробный план
      <select value={path} onChange={event => setPath(event.target.value)}>
        <option value={overview}>Общий список улучшений</option>
        {Object.keys(documents).filter(key => key !== overview).sort().map(key => <option key={key} value={key}>{documentTitle(key)}</option>)}
      </select>
    </label>
    <div ref={content} className="modal-content improvements-content" tabIndex={0}>
      {documents[path].trim().split(/\n\s*\n/).map((block, index) => {
        if (block.startsWith('|')) {
          const rows = block.split('\n').map(row => row.trim().slice(1, -1).split('|').map(cell => cell.trim()));
          return <div key={index} className="improvements-table" tabIndex={0} role="region" aria-label="Таблица улучшений">
            <table><thead><tr>{rows[0].map((cell, column) => <th key={column} scope="col">{inline(cell)}</th>)}</tr></thead>
              <tbody>{rows.slice(2).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) => <td key={column}>{inline(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>;
        }
        const heading = block.match(/^(#{1,3}) (.+)$/);
        if (heading) return <h3 key={index}>{heading[2]}</h3>;
        return <p key={index}>{inline(block)}</p>;
      })}
    </div>
  </dialog>;
}
