import { useEffect, useRef, useState } from 'react';

export default function PwaUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [deferred, setDeferred] = useState(false);
  const [updating, setUpdating] = useState(false);
  const reloadRequested = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let disposed = false;
    let checking = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;

    const showUpdate = () => {
      if (!disposed) setWaitingWorker(navigator.serviceWorker.controller ? registration?.waiting ?? null : null);
    };
    const watchInstalling = () => {
      installing?.removeEventListener('statechange', showUpdate);
      installing = registration?.installing ?? null;
      installing?.addEventListener('statechange', showUpdate);
      showUpdate();
    };
    const checkForUpdate = async () => {
      if (disposed || document.visibilityState !== 'visible') return;
      setDeferred(false);
      showUpdate();
      if (checking) return;
      checking = true;
      try {
        if (!registration) {
          registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' });
          if (disposed) return;
          registration.addEventListener('updatefound', watchInstalling);
          watchInstalling();
        }
        await registration.update();
      } catch {
        // Keep the cached game playable; retry on the next entry or when back online.
      } finally {
        checking = false;
        showUpdate();
      }
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) void checkForUpdate(); };
    const onControllerChange = () => {
      if (reloadRequested.current) {
        reloadRequested.current = false;
        window.location.reload();
      } else showUpdate();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', checkForUpdate);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', checkForUpdate);
    if (document.readyState === 'complete') void checkForUpdate();
    else window.addEventListener('load', checkForUpdate, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener('load', checkForUpdate);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', watchInstalling);
      installing?.removeEventListener('statechange', showUpdate);
    };
  }, []);

  if (!waitingWorker || deferred) return null;
  return <aside className="pwa-update" role="status" aria-label="Обновление игры">
    <div><strong>Доступна новая версия игры</strong><p>Обновите игру, чтобы получить последние изменения. Прогресс чтения и сохранения останутся.</p></div>
    <div className="pwa-update-actions">
      <button className="primary-button" disabled={updating} onClick={() => {
        reloadRequested.current = true;
        setUpdating(true);
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }}>{updating ? 'Обновление…' : 'Обновить'}</button>
      <button className="text-button" disabled={updating} onClick={() => setDeferred(true)}>Позже</button>
    </div>
  </aside>;
}
