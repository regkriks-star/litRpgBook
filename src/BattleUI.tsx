import SceneObject from './SceneObject';
import type { ReactNode } from 'react';

export function Meter({ value, max, name, kind = 'hp' }: { value: number; max: number; name: string; kind?: string }) {
  return <SceneObject id="BattleUI-meter-1" kind="group"><div className={`meter ${kind}`}>
    <span>{kind === 'mp' ? 'MP' : 'HP'}</span>
    <div role="meter" aria-label={name} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><SceneObject id="BattleUI-i-1" kind="effect"><i style={{ width: `${value / max * 100}%` }} /></SceneObject></div>
    <small>{value}<span>/{max}</span></small>
  </div></SceneObject>;
}

export function BattleControls({ children, caption, message, className = '' }: { children: ReactNode; caption?: string; message?: ReactNode; className?: string }) {
  return <SceneObject id="BattleUI-battle-controls-1" kind="group"><section className={`battle-controls ${className}`} aria-label="Команды боя">
    {caption && <SceneObject id="BattleUI-turn-info-1" kind="group"><div className="turn-info"><span>{caption}</span><p>{message}</p></div></SceneObject>}
    <SceneObject id="BattleUI-action-grid-1" kind="group"><div className="action-grid">{children}</div></SceneObject>
  </section></SceneObject>;
}
