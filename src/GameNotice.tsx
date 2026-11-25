import SceneObject from './SceneObject';
import { useEffect, useState, type ReactNode } from 'react';
import { Sparkles, Trophy } from 'lucide-react';

export default function GameNotice({ title, children, kind }: { title: string; children: ReactNode; kind: 'achievement' | 'xp' }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setVisible(false), 6500); return () => clearTimeout(timer); }, []);
  if (!visible) return null;
  const Icon = kind === 'achievement' ? Trophy : Sparkles;
  return <SceneObject id="GameNotice-game-notice-1" kind="group"><aside className={`game-notice ${kind}`} role="status"><Icon aria-hidden="true" /><div><small>{title}</small><strong>{children}</strong></div></aside></SceneObject>;
}
