import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Settings2, X } from 'lucide-react';
import './reader-settings.css';

export const readerSettingsKey = 'lazy-courage:reader-settings:v1';
type ReaderSettings = { font: number; window: number; transparency: number };
const defaults: ReaderSettings = { font: 100, window: 100, transparency: 0 };

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number / 5) * 5));
}

function load(): ReaderSettings {
  try {
    const value = JSON.parse(localStorage.getItem(readerSettingsKey) ?? 'null');
    if (value && typeof value === 'object') return {
      font: clamp(value.font, 80, 140, 100),
      window: clamp(value.window, 80, 120, 100),
      transparency: clamp(value.transparency, 0, 65, 0),
    };
  } catch { /* Settings stay at their defaults without storage. */ }
  return { ...defaults };
}

/** Shared reading settings for every book surface: font size, window size and
 * background transparency. Values live on <html> so a chapter only has to
 * render the button; future chapters inherit the same look and storage key. */
export default function ReaderSettings() {
  const [settings, setSettings] = useState(load);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--reader-font-scale', String(settings.font / 100));
    root.style.setProperty('--reader-window-scale', String(settings.window / 100));
    root.style.setProperty('--reader-window-alpha', String(1 - settings.transparency / 100));
  }, [settings]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const click = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('.reader-settings, .reader-settings-button')) return;
      setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', click);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', click); document.removeEventListener('keydown', key); };
  }, [open]);

  const change = (key: keyof ReaderSettings, value: number) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try { localStorage.setItem(readerSettingsKey, JSON.stringify(next)); }
    catch { /* Sliders keep working for this page without storage. */ }
  };
  const reset = () => {
    setSettings({ ...defaults });
    try { localStorage.setItem(readerSettingsKey, JSON.stringify(defaults)); }
    catch { /* Sliders keep working for this page without storage. */ }
  };
  const close = () => { setOpen(false); button.current?.focus(); };

  return <>
    <button ref={button} className="icon-button reader-settings-button" aria-label="Настройки чтения" title="Настройки чтения" aria-expanded={open} aria-controls="reader-settings" onClick={() => setOpen(value => !value)}><Settings2 size={18} /></button>
    {open && <aside ref={panel} id="reader-settings" className="reader-settings" role="dialog" aria-label="Настройки чтения" tabIndex={-1}>
      <header><h2>Настройки чтения</h2><button className="icon-button" aria-label="Закрыть настройки" title="Закрыть настройки" onClick={close}><X size={18} /></button></header>
      <label className="reader-setting"><span>Размер шрифта<output>{settings.font}%</output></span><input type="range" min="80" max="140" step="5" value={settings.font} aria-label="Размер шрифта" onChange={event => change('font', Number(event.target.value))} /></label>
      <label className="reader-setting"><span>Размер окна<output>{settings.window}%</output></span><input type="range" min="80" max="120" step="5" value={settings.window} aria-label="Размер окна с текстом" onChange={event => change('window', Number(event.target.value))} /></label>
      <label className="reader-setting"><span>Прозрачность окна<output>{settings.transparency}%</output></span><input type="range" min="0" max="65" step="5" value={settings.transparency} aria-label="Прозрачность окна с текстом" onChange={event => change('transparency', Number(event.target.value))} /></label>
      <button className="text-button" onClick={reset}>Сбросить настройки</button>
    </aside>}
  </>;
}
