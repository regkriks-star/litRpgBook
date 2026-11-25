import BookText from './BookText';
import { useLayoutEffect, useRef } from 'react';
import { speakers, type Line } from './story';

// All speech bubbles share the same sprite anchor and viewport constraints.
export default function SpeechBubble({ line }: { line: Line }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const bubble = ref.current!;
    const character = bubble.parentElement!;
    const sprite = character.querySelector<HTMLElement>('.sprite')!;
    const stage = bubble.closest('.stage')!;
    const header = stage.querySelector('.game-header')!;
    const text = bubble.querySelector('p')!;
    let frame = 0;
    let previous = '';
    let disposed = false;
    const update = () => {
      const actor = character.getBoundingClientRect();
      const anchor = sprite.getBoundingClientRect();
      const bounds = stage.getBoundingClientRect();
      const top = Math.max(bounds.top, header.getBoundingClientRect().bottom) + 8;
      const font = getComputedStyle(text).font;
      const geometry = [actor.x, actor.y, anchor.x, anchor.y, anchor.width, bounds.width, bounds.height, top, font].join(',');
      if (geometry !== previous) {
        previous = geometry;
        const tail = 14;
        const maxWidth = bounds.width - 24;
        const available = Math.max(0, anchor.top - tail - top);
        bubble.style.maxWidth = `${maxWidth}px`;
        bubble.style.maxHeight = `${available}px`;
        bubble.style.width = 'max-content';
        // Start compact; only widen when doing so removes vertical scrolling.
        let low = Math.min(220, maxWidth, bubble.getBoundingClientRect().width);
        let high = maxWidth;
        bubble.style.width = `${low}px`;
        if (text.scrollHeight > text.clientHeight + 1) {
          while (high - low > 1) {
            const width = (low + high) / 2;
            bubble.style.width = `${width}px`;
            if (text.scrollHeight > text.clientHeight + 1) low = width;
            else high = width;
          }
          bubble.style.width = `${Math.ceil(high)}px`;
        }
        const size = bubble.getBoundingClientRect();
        const tip = anchor.left + anchor.width / 2;
        const left = Math.max(bounds.left + 12, Math.min(tip - size.width / 2, bounds.right - 12 - size.width));
        bubble.style.left = `${left - actor.left}px`;
        bubble.style.top = `${anchor.top - tail - size.height - actor.top}px`;
        bubble.style.setProperty('--tail-x', `${tip - left - 2}px`);
      }
    };
    const running = () => stage.getAnimations({ subtree: true }).some(animation => animation.playState === 'running');
    const schedule = () => {
      if (disposed || frame) return;
      frame = requestAnimationFrame(tick);
    };
    const tick = () => {
      frame = 0;
      if (disposed) return;
      update();
      if (running()) schedule();
    };
    update();
    if (running()) schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(character);
    observer.observe(bubble);
    window.addEventListener('resize', schedule);
    // Follow camera pans, sprite lunges and CSS transitions only while they run.
    stage.addEventListener('transitionrun', schedule);
    stage.addEventListener('transitionend', schedule);
    stage.addEventListener('animationstart', schedule);
    stage.addEventListener('animationend', schedule);
    void document.fonts.ready.then(() => { if (!disposed) { previous = ''; schedule(); } });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      stage.removeEventListener('transitionrun', schedule);
      stage.removeEventListener('transitionend', schedule);
      stage.removeEventListener('animationstart', schedule);
      stage.removeEventListener('animationend', schedule);
    };
  }, [line]);
  return <div ref={ref} className="speech-bubble" aria-live="polite">
    <span>{speakers[line.speaker]}</span><p tabIndex={0}><BookText text={line.text} /></p>
  </div>;
}
