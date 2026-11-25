import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ClipboardPaste, Copy, FlipHorizontal2, FlipVertical2, Layers, Magnet, MessageSquare, Monitor, MousePointer2, Play, Redo2, RotateCcw, Save, Smartphone, Trash2, Undo2, Upload, X } from 'lucide-react';
import { changeElement, changeTransform, chapterLengths, cloneElementInFrame, elementAt, parseSceneChapter, sceneFileName, transformAt, type SceneChapter, type SceneChapterId, type SceneTransform, type SceneViewport } from './scene-layout';
import { readSceneDocument, saveSceneDocument } from './scene-documents';
import { chapterReplay } from './scene-replay';
import type { SceneGesture, SceneObjectInfo } from './SceneObject';
import './scene-editor.css';

const presets = [
  { label: '1440 × 900', width: 1440, height: 900, viewport: 'desktop' },
  { label: '1280 × 600', width: 1280, height: 600, viewport: 'desktop' },
  { label: '1024 × 600', width: 1024, height: 600, viewport: 'desktop' },
  { label: '844 × 390', width: 844, height: 390, viewport: 'mobile' },
  { label: '568 × 320', width: 568, height: 320, viewport: 'mobile' },
] as const;
const names: Record<string, string> = { 'goddess-position': 'Датарис и трон', 'soul-position': 'Душа электрика', 'fiol-shadow': 'Тень Фиол', 'divine-seal': 'Божественная печать', 'spell-circles': 'Магические круги', 'voice-rings': 'Голос души', 'reborn-position': 'Новое тело Мача', 'chapter-hero-position': 'Мач', 'c3-hero': 'Мач', 'c4-hero': 'Мач', 'c5-hero': 'Мач', 'chapter-guards': 'Стражники', 'chapter-cart': 'Повозка', 'chapter-ride': 'Поездка в повозке', 'chapter-rabbit-position': 'Кролик', 'c3-rabbit': 'Кролик', 'c4-rabbit': 'Кролик', 'chapter-loot': 'Добыча', 'creation-panel': 'Создание героя', 'class-field': 'Поле карт', 'chapter-menu': 'Окно героя', 'c3-actions': 'Действия героя', 'training-battle': 'Показательный бой' };
const displayName = (object: SceneObjectInfo) => names[object.label] ?? (/^[a-z0-9_/-]+$/i.test(object.label) ? ({ sprite: 'Спрайт', effect: 'Элемент эффекта', control: 'Действие', group: 'Группа объектов' }[object.kind] + ' ' + (object.id.match(/-(\d+)(?::\d+)?$/)?.[1] ?? '')) : object.label);
function previewUrl(chapter: SceneChapterId, frame: number, variant: string, viewport: SceneViewport, motion: boolean, ghost = false) {
  const url = new URL(location.href);
  url.search = new URLSearchParams({ 'scene-preview': '1', chapter: String(chapter), frame: String(frame), variant, viewport, motion: motion ? 'play' : 'still', ghost: ghost ? '1' : '0' }).toString();
  url.hash = ''; return url.href;
}
function download(doc: SceneChapter) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = sceneFileName(doc.chapter); link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function SceneEditor({ onClose }: { onClose: () => void }) {
  const [chapter, setChapter] = useState<SceneChapterId>(1);
  const [frame, setFrame] = useState(0);
  const [variant, setVariant] = useState('start');
  const [previewVariant, setPreviewVariant] = useState('start');
  const [documents, setDocuments] = useState(() => Object.fromEntries(([1, 2, 3, 4, 5] as const).map(id => [id, readSceneDocument(id)])) as Record<SceneChapterId, SceneChapter>);
  const [preset, setPreset] = useState(0);
  const [showText, setShowText] = useState(true);
  const [showGhost, setShowGhost] = useState(false);
  const [motion, setMotion] = useState(false);
  const [editing, setEditing] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [objects, setObjects] = useState<SceneObjectInfo[]>([]);
  const [previous, setPrevious] = useState<SceneObjectInfo[]>([]);
  const [clipboard, setClipboard] = useState<{ chapter: number; frame: number; variant: string; id: string; document: SceneChapter } | null>(null);
  const [status, setStatus] = useState('Выберите объект в сцене или в списке.');
  const [saving, setSaving] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [zoom, setZoom] = useState(0.5);
  const currentIframe = useRef<HTMLIFrameElement>(null);
  const previousIframe = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const histories = useRef(new Map<number, { past: SceneChapter[]; future: SceneChapter[] }>());
  const lastVariants = useRef(new Map<string, string>());
  const saved = useRef(documents);
  const state = useRef({ chapter, frame, variant, documents, preset, selected, editing, showText, showGhost, objects });
  state.current = { chapter, frame, variant, documents, preset, selected, editing, showText, showGhost, objects };
  const dragging = useRef(false);
  const snapping = useRef<{ id: string; target: SceneObjectInfo; scale: number; flipX: boolean; flipY: boolean } | null>(null);
  const doc = documents[chapter];
  const dimensions = presets[preset];
  const viewport = dimensions.viewport;
  const states = chapterReplay(chapter)[frame];
  const active = objects.find(object => object.id === selected);
  const objectIds = new Set(objects.map(object => object.id));
  const childrenByParent = new Map<string, SceneObjectInfo[]>();
  for (const object of objects) {
    let parent = object.id.slice(0, Math.max(0, object.id.lastIndexOf('/')));
    // Scopes contribute to IDs but do not appear as editable objects.
    while (parent && !objectIds.has(parent)) parent = parent.slice(0, Math.max(0, parent.lastIndexOf('/')));
    const siblings = childrenByParent.get(parent) ?? [];
    siblings.push(object);
    childrenByParent.set(parent, siblings);
  }
  function renderObjects(parent = ''): ReactNode {
    return childrenByParent.get(parent)?.map(object => {
      const children = childrenByParent.get(object.id);
      let badge = { sprite: 'Спрайт', effect: 'Эффект', control: 'Действие', group: 'Группа' }[object.kind];
      if (children) badge = 'Группа';
      if (object.id.startsWith('copy-')) badge = 'Копия';
      if (object.deleted) badge = 'Удалён';
      return <li key={object.id}>
        <button title={displayName(object)} data-scene-object-id={object.id} aria-pressed={object.id === selected} onClick={() => setSelected(object.id)}>
          {children && <Layers size={13} aria-hidden="true" />}<span>{displayName(object)}</span>
          <small>{badge}</small>
        </button>
        {children && <ul aria-label={`Внутри: ${displayName(object)}`}>{renderObjects(object.id)}</ul>}
      </li>;
    });
  }
  const element = selected ? elementAt(doc, frame, variant, selected) : null;
  const transform = element ? transformAt(element, viewport) : null;
  const visiblePrevious = previous.filter(object => !object.deleted && object.width > 0 && object.height > 0);
  const ghost = active ? visiblePrevious.find(object => object.id === active.id) ?? visiblePrevious.find(object => object.source === active.source) : undefined;
  const history = histories.current.get(chapter);
  const dirty = ([1, 2, 3, 4, 5] as const).some(id => documents[id] !== saved.current[id]);
  void historyVersion;
  const commit = useCallback((next: SceneChapter, remember = true) => {
    const s = state.current;
    if (remember) {
      const history = histories.current.get(next.chapter) ?? { past: [], future: [] };
      history.past.push(s.documents[next.chapter]); if (history.past.length > 50) history.past.shift(); history.future = [];
      histories.current.set(next.chapter, history); setHistoryVersion(value => value + 1);
    }
    state.current.documents = { ...s.documents, [next.chapter]: next };
    setDocuments(state.current.documents);
    setStatus('Есть несохранённые изменения.');
  }, []);
  const change = (patch: Partial<SceneTransform>) => {
    if (!selected || element?.locked) return;
    commit(changeTransform(doc, frame, variant, selected, viewport, patch));
  };
  const undo = useCallback((redo = false) => {
    const s = state.current, history = histories.current.get(s.chapter);
    if (!history) return;
    const source = redo ? history.future : history.past, target = redo ? history.past : history.future;
    const next = source.pop(); if (!next) return;
    target.push(s.documents[s.chapter]); commit(next, false); setHistoryVersion(value => value + 1);
  }, [commit]);
  const copy = useCallback(() => {
    const s = state.current;
    if (!s.selected) return;
    const element = elementAt(s.documents[s.chapter], s.frame, s.variant, s.selected);
    if (element.deleted) return;
    setClipboard({ chapter: s.chapter, frame: s.frame, variant: s.variant, id: s.selected, document: s.documents[s.chapter] });
    setStatus('Объект скопирован. Вставьте его в этом кадре.');
  }, []);
  const paste = useCallback(() => {
    const s = state.current;
    if (!clipboard || clipboard.chapter !== s.chapter || clipboard.frame !== s.frame || !s.objects.some(object => object.id === clipboard.id)) return;
    const result = cloneElementInFrame(s.documents[s.chapter], s.frame, s.variant, clipboard.id, presets[s.preset].viewport, clipboard);
    commit(result.doc); setSelected(result.id);
  }, [clipboard, commit]);
  const remove = useCallback(() => {
    const s = state.current; if (!s.selected) return;
    commit(changeElement(s.documents[s.chapter], s.frame, s.variant, s.selected, element => ({ ...element, deleted: !element.deleted })));
  }, [commit]);
  const key = useCallback((key: string, ctrl: boolean, shift: boolean) => {
    const s = state.current;
    if (ctrl && key.toLowerCase() === 'z') { undo(shift); return; }
    if (ctrl && key.toLowerCase() === 'y') { undo(true); return; }
    if (ctrl && key.toLowerCase() === 'c') { copy(); return; }
    if (ctrl && key.toLowerCase() === 'v') { paste(); return; }
    if (key === 'Delete' || key === 'Backspace') { remove(); return; }
    if (!s.selected || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return;
    const element = elementAt(s.documents[s.chapter], s.frame, s.variant, s.selected);
    if (element.locked || element.deleted) return;
    const transform = transformAt(element, presets[s.preset].viewport), amount = shift ? 10 : 1;
    commit(changeTransform(s.documents[s.chapter], s.frame, s.variant, s.selected, presets[s.preset].viewport, { x: transform.x + (key === 'ArrowLeft' ? -amount : key === 'ArrowRight' ? amount : 0) / presets[s.preset].width * 100, y: transform.y + (key === 'ArrowUp' ? -amount : key === 'ArrowDown' ? amount : 0) / presets[s.preset].height * 100 }));
  }, [commit, copy, paste, remove, undo]);
  const sendLayout = useCallback(() => {
    const s = state.current;
    const message = { type: 'litrpg:scene-layout', document: s.documents[s.chapter], variant: s.variant, selected: s.selected, editing: s.editing, hideStory: !s.showText };
    currentIframe.current?.contentWindow?.postMessage(message, location.origin);
    const ghostVariant = lastVariants.current.get(s.chapter + ':' + (s.frame - 1)) ?? 'start';
    previousIframe.current?.contentWindow?.postMessage({ ...message, variant: ghostVariant, editing: false, hideStory: true }, location.origin);
  }, []);
  useEffect(sendLayout, [doc, variant, selected, editing, showText, sendLayout]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const message = event.data;
      if (event.origin !== location.origin || message?.type !== 'litrpg:scene-preview') return;
      const ghostMessage = event.source === previousIframe.current?.contentWindow;
      if (!ghostMessage && event.source !== currentIframe.current?.contentWindow) return;
      const s = state.current;
      if (message.chapter !== s.chapter || message.frame !== (ghostMessage ? s.frame - 1 : s.frame)) return;
      if (message.event === 'ready') { sendLayout(); return; }
      if (message.event === 'objects' && Array.isArray(message.objects)) {
        const infos = message.objects as SceneObjectInfo[];
        if (ghostMessage) { setPrevious(infos); return; }
        setObjects(infos);
        const snap = snapping.current;
        const info = snap && infos.find(info => info.id === snap.id);
        if (snap && info && info.transform.scale === snap.scale && info.transform.flipX === snap.flipX && info.transform.flipY === snap.flipY) {
          snapping.current = null;
          const transform = transformAt(elementAt(s.documents[s.chapter], s.frame, s.variant, snap.id), presets[s.preset].viewport);
          const positioned = changeTransform(s.documents[s.chapter], s.frame, s.variant, snap.id, presets[s.preset].viewport, { x: transform.x + snap.target.x + snap.target.width / 2 - info.x - info.width / 2, y: transform.y + snap.target.y + snap.target.height - info.y - info.height });
          commit(changeElement(positioned, s.frame, s.variant, snap.id, element => ({ ...element, locked: true })), false);
          setStatus('Размещение скопировано с предыдущего кадра. Объект зафиксирован.');
        }
      }
      if (ghostMessage) return;
      if (message.event === 'gesture') {
        const gesture = message.gesture as SceneGesture;
        if (gesture.type === 'select') { dragging.current = false; setSelected(gesture.id); }
        if (gesture.type === 'move') {
          commit(changeTransform(s.documents[s.chapter], s.frame, s.variant, gesture.id, presets[s.preset].viewport, { x: gesture.x, y: gesture.y }), !dragging.current);
          dragging.current = !gesture.finished;
        }
      }
      if (message.event === 'key') key(message.key, message.ctrlKey, message.shiftKey);
      if (message.event === 'frame' && Number.isInteger(message.currentFrame) && message.currentFrame !== s.frame && message.currentFrame >= 0 && message.currentFrame < chapterLengths[s.chapter]) { setFrame(message.currentFrame); setVariant('start'); setPreviewVariant('start'); setSelected(null); }
      else if (message.event === 'frame' && !s.editing && message.currentVariant !== s.variant && chapterReplay(s.chapter)[s.frame].some(state => state.id === message.currentVariant)) setVariant(message.currentVariant);
    };
    addEventListener('message', receive); return () => removeEventListener('message', receive);
  }, [commit, key, sendLayout]);
  useEffect(() => {
    const target = canvas.current; if (!target) return;
    const resize = () => setZoom(Math.max(0.1, Math.min(target.clientWidth / dimensions.width, target.clientHeight / dimensions.height, 1)));
    const observer = new ResizeObserver(resize); observer.observe(target); resize(); return () => observer.disconnect();
  }, [dimensions]);
  useEffect(() => {
    setObjects([]); setPrevious([]); setSelected(null); dragging.current = false; snapping.current = null;
    lastVariants.current.set(chapter + ':' + frame, variant);
  }, [chapter, frame, variant, preset, motion]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, select')) return;
      if (['Delete', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) || (event.ctrlKey || event.metaKey) && ['z', 'y', 'c', 'v'].includes(event.key.toLowerCase())) { event.preventDefault(); key(event.key, event.ctrlKey || event.metaKey, event.shiftKey); }
    };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    addEventListener('keydown', handle); addEventListener('beforeunload', beforeUnload);
    return () => { removeEventListener('keydown', handle); removeEventListener('beforeunload', beforeUnload); };
  }, [key, dirty]);
  function navigate(next: number) { setFrame(Math.max(0, Math.min(next, chapterLengths[chapter] - 1))); setVariant('start'); setPreviewVariant('start'); }
  function magnet() {
    if (!selected || !element || !transform) return;
    if (element.locked) { commit(changeElement(doc, frame, variant, selected, element => ({ ...element, locked: false }))); return; }
    if (!active || !ghost || !active.width || !ghost.width) return;
    const scale = Math.max(0.05, Math.min(20, transform.scale * ghost.width / active.width));
    const flipX = (ghost.transform.flipX !== (ghost.parentScaleX < 0)) !== (active.parentScaleX < 0);
    const flipY = (ghost.transform.flipY !== (ghost.parentScaleY < 0)) !== (active.parentScaleY < 0);
    snapping.current = { id: selected, target: ghost, scale, flipX, flipY };
    commit(changeTransform(doc, frame, variant, selected, viewport, { scale, flipX, flipY }));
  }
  async function save() {
    setSaving(true);
    try {
      const verified = parseSceneChapter(doc, chapter);
      const browserSaved = saveSceneDocument(verified);
      let message = browserSaved ? 'Сохранено для игры в этом браузере. JSON главы скачан.' : 'JSON главы скачан. Хранилище браузера недоступно; для переноса изменений используйте этот файл.';
      if (import.meta.env.DEV) {
        try {
          const response = await fetch(new URL('__scene-editor/' + sceneFileName(chapter), location.href), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(verified, null, 2) + '\n' });
          if (!response.ok) throw new Error('Запись файла недоступна.');
          message = 'JSON главы записан в проект и скачан. Постановка сохранена для игры.';
        } catch { message += ' Запись в проект не удалась; используйте скачанный JSON.'; }
      }
      download(verified);
      saved.current = { ...saved.current, [chapter]: doc };
      setStatus(message);
    } catch (error) { setStatus('Не удалось сохранить: ' + (error instanceof Error ? error.message : 'хранилище недоступно.')); }
    finally { setSaving(false); }
  }
  async function importFile(upload: File | undefined) {
    if (!upload) return;
    try {
      if (upload.size > 20 * 1024 * 1024) throw new Error('Файл больше 20 МБ.');
      commit(parseSceneChapter(JSON.parse(await upload.text()), chapter)); setStatus('JSON загружен. Нажмите «Сохранить главу», чтобы применить его в игре.');
    } catch (error) { setStatus('Не удалось открыть JSON: ' + (error instanceof Error ? error.message : 'неверный файл.')); }
    if (file.current) file.current.value = '';
  }
  const canPaste = Boolean(clipboard && clipboard.chapter === chapter && clipboard.frame === frame && objects.some(object => object.id === clipboard.id));
  const previousVariant = lastVariants.current.get(chapter + ':' + (frame - 1)) ?? 'start';
  return <main className="scene-editor" aria-label="Редактор сцен">
    <header className="scene-editor-header"><div><h1>Редактор сцен</h1><p>Ленивое мужество</p></div><div className="scene-editor-file-actions">
      <button onClick={() => file.current?.click()}><Upload size={18} />Открыть JSON</button><input ref={file} type="file" accept="application/json,.json" hidden onChange={event => void importFile(event.target.files?.[0])} />
      <button className="editor-save" disabled={saving} onClick={() => void save()}><Save size={18} />{saving ? 'Сохранение…' : 'Сохранить главу'}</button>
      <button aria-label="Закрыть редактор" onClick={() => { if (!dirty || confirm('Есть несохранённые изменения. Закрыть редактор?')) onClose(); }}><X size={20} /></button>
    </div></header>
    <nav className="scene-editor-toolbar" aria-label="Инструменты редактора">
      <label>Глава<select aria-label="Глава для редактирования" value={chapter} onChange={event => { setChapter(Number(event.target.value) as SceneChapterId); setFrame(0); setVariant('start'); setPreviewVariant('start'); }}>{([1, 2, 3, 4, 5] as const).map(id => <option key={id} value={id}>Глава {id}</option>)}</select></label>
      <div className="editor-frame-navigation"><button aria-label="Предыдущий кадр" disabled={!frame} onClick={() => navigate(frame - 1)}><ArrowLeft size={18} /></button><label>Кадр<input aria-label="Номер кадра" type="number" min={1} max={chapterLengths[chapter]} value={frame + 1} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value)) navigate(value - 1); }} /></label><span>/ {chapterLengths[chapter]}</span><button aria-label="Следующий кадр" disabled={frame === chapterLengths[chapter] - 1} onClick={() => navigate(frame + 1)}><ArrowRight size={18} /></button></div>
      <label className="editor-state-choice">Состояние<select aria-label="Состояние кадра" value={variant} onChange={event => { setVariant(event.target.value); setPreviewVariant(event.target.value); }}>{states.map(state => <option key={state.id} value={state.id}>{state.label}</option>)}</select></label>
      <button aria-label="Отменить изменение" title="Отменить последнее действие (Ctrl+Z)" aria-keyshortcuts="Control+Z Meta+Z" disabled={!history?.past.length} onClick={() => undo()}><Undo2 size={18} /></button><button aria-label="Повторить изменение" title="Ctrl+Shift+Z" disabled={!history?.future.length} onClick={() => undo(true)}><Redo2 size={18} /></button>
    </nav>
    <div className="scene-editor-workspace">
      <aside className="scene-editor-inspector scene-editor-objects" aria-label="Объекты сцены">
        <section className="editor-objects"><h2>Объекты кадра <small>{objects.length}</small></h2><ul className="editor-object-list" aria-label="Объекты кадра">{renderObjects()}</ul></section>
      </aside>
      <section className="scene-editor-preview" aria-label="Сцена и предпросмотр"><div className="editor-preview-controls">
        <label>{viewport === 'mobile' ? <Smartphone size={18} /> : <Monitor size={18} />}<select aria-label="Размер предпросмотра" value={preset} onChange={event => { setPreviewVariant(variant); setPreset(Number(event.target.value)); }}>{presets.map((size, index) => <option key={size.label} value={index}>{size.viewport === 'mobile' ? 'Телефон ' : 'Экран '}{size.label}</option>)}</select></label>
        <button aria-label="Окно текста" title="Окно текста" aria-pressed={showText} onClick={() => setShowText(value => !value)}><MessageSquare size={17} /></button><button aria-label="Предыдущие спрайты" title="Предыдущие спрайты" aria-pressed={showGhost} disabled={!frame} onClick={() => setShowGhost(value => !value)}><Layers size={17} /></button>
        <button aria-label="Анимации" title="Анимации" aria-pressed={motion} onClick={() => { setPreviewVariant(variant); setMotion(value => !value); }}><Play size={17} /></button><button aria-label={editing ? 'Проверить действия' : 'Редактировать'} title={editing ? 'Проверить действия' : 'Редактировать'} aria-pressed={!editing} onClick={() => setEditing(value => !value)}><MousePointer2 size={17} /></button>
      </div><div ref={canvas} className="editor-canvas-area"><div className="editor-canvas" style={{ width: dimensions.width * zoom, height: dimensions.height * zoom }}>
        <iframe key={chapter + ':' + frame + ':' + previewVariant + ':' + preset + ':' + motion} ref={currentIframe} title="Предпросмотр сцены" className="editor-scene-frame" src={previewUrl(chapter, frame, previewVariant, viewport, motion)} width={dimensions.width} height={dimensions.height} style={{ transform: 'scale(' + zoom + ')' }} onLoad={sendLayout} />
        {frame > 0 && <iframe key={'ghost:' + chapter + ':' + frame + ':' + previousVariant + ':' + preset} ref={previousIframe} title="Предыдущий кадр" aria-hidden="true" tabIndex={-1} className="editor-scene-frame editor-ghost-frame" src={previewUrl(chapter, frame - 1, previousVariant, viewport, false, true)} width={dimensions.width} height={dimensions.height} style={{ transform: 'scale(' + zoom + ')', visibility: showGhost ? 'visible' : 'hidden' }} onLoad={sendLayout} />}
      </div></div><p className="editor-preview-note">{editing ? 'Выберите объект и перетащите. Стрелки двигают на 1 px, Shift — на 10 px.' : 'Действия выполняются только в предпросмотре. Прогресс игры сохраняется отдельно.'}{viewport === 'mobile' && ' Мобильные поправки относятся к горизонтальным экранам телефона.'}</p></section>
      <aside className="scene-editor-inspector" aria-label="Параметры и комментарий">
        <section className="editor-properties"><h2>{active ? displayName(active) : 'Размещение'}</h2>{!active || !element || !transform ? <p>Выберите объект в списке или на сцене.</p> : <>
          <div className="editor-object-actions"><button aria-label="Копировать" title="Копировать (Ctrl+C)" aria-keyshortcuts="Control+C Meta+C" disabled={element.deleted} onClick={copy}><Copy size={17} /></button><button aria-label="Вставить" title="Вставить (Ctrl+V)" disabled={!canPaste} onClick={paste}><ClipboardPaste size={17} /></button><button aria-label={element.deleted ? 'Восстановить' : 'Удалить'} title={element.deleted ? 'Восстановить' : 'Удалить (Delete)'} onClick={remove}>{element.deleted ? <RotateCcw size={17} /> : <Trash2 size={17} />}</button></div>
          <fieldset disabled={element.locked || element.deleted}><legend>{viewport === 'mobile' ? 'Мобильное размещение' : 'Общее размещение'}</legend><div className="editor-coordinate-fields">
            <label title="Смещение X, %">X, %<input aria-label="Смещение X" type="number" min={-500} max={500} step={0.1} value={Math.round(transform.x * 1000) / 1000} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && Math.abs(value) <= 500) change({ x: value }); }} /></label>
            <label title="Смещение Y, %">Y, %<input aria-label="Смещение Y" type="number" min={-500} max={500} step={0.1} value={Math.round(transform.y * 1000) / 1000} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && Math.abs(value) <= 500) change({ y: value }); }} /></label>
            <label>Масштаб<input aria-label="Масштаб объекта" type="number" min={0.05} max={20} step={0.05} value={Math.round(transform.scale * 1000) / 1000} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0.05 && value <= 20) change({ scale: value }); }} /></label>
          </div><div className="editor-flip-actions"><button aria-label="Отразить горизонтально" title="Отразить горизонтально" aria-pressed={transform.flipX} onClick={() => change({ flipX: !transform.flipX })}><FlipHorizontal2 size={18} /></button><button aria-label="Отразить вертикально" title="Отразить вертикально" aria-pressed={transform.flipY} onClick={() => change({ flipY: !transform.flipY })}><FlipVertical2 size={18} /></button></div></fieldset>
          <button aria-label={element.locked ? 'Отмагнитить' : 'Примагнитить'} title={element.locked ? 'Отмагнитить' : 'Примагнитить к предыдущему кадру'} className="editor-magnet" disabled={!element.locked && !ghost} onClick={magnet}><Magnet size={17} /></button>
          {!element.locked && frame > 0 && !ghost && <p className="editor-hint">В предыдущем кадре нет этого объекта.</p>}
          {viewport === 'mobile' && <button className="editor-reset-mobile" disabled={!element.mobile || element.locked} onClick={() => commit(changeElement(doc, frame, variant, active.id, element => { const { mobile: _, ...rest } = element; return rest; }))}>Использовать общее размещение</button>}
        </>}</section>
        <section className="editor-comment"><label htmlFor="scene-comment">Комментарий к кадру</label><textarea id="scene-comment" maxLength={20000} placeholder="Что учесть при следующей переработке сцены…" value={doc.frames[frame].comment} onChange={event => { commit({ ...doc, frames: doc.frames.map((current, index) => index === frame ? { ...current, comment: event.target.value } : current) }); }} /><small>Сохранится в JSON. Во время игры не показывается.</small></section>
      </aside>
    </div><footer className="scene-editor-status" role="status">{status}</footer>
  </main>;
}
