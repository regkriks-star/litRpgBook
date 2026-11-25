import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/alegreya/cyrillic-400.css';
import '@fontsource/alegreya/cyrillic-400-italic.css';
import '@fontsource/alegreya/cyrillic-500.css';
import '@fontsource/alegreya/cyrillic-600.css';
import '@fontsource/alegreya/latin-400.css';
import '@fontsource/alegreya/latin-400-italic.css';
import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/cyrillic-500.css';
import '@fontsource/golos-text/latin-400.css';
import App from './App';
import ScenePreview, { prepareScenePreview } from './ScenePreview';
import PwaUpdate from './PwaUpdate';
import { Smartphone } from 'lucide-react';
import './styles.css';

const scenePreview = new URLSearchParams(location.search).get('scene-preview') === '1';
const sceneEditor = new URLSearchParams(location.search).get('scene-editor') === '1';
const SceneEditor = React.lazy(() => import('./SceneEditor'));
if (scenePreview) prepareScenePreview();

ReactDOM.createRoot(document.getElementById('root')!).render(scenePreview ? <ScenePreview /> : sceneEditor ? <React.Suspense fallback={<p>Открываем редактор…</p>}><SceneEditor onClose={() => { const url = new URL(location.href); url.searchParams.delete('scene-editor'); location.assign(url.href); }} /></React.Suspense> : <React.StrictMode>
  <App />
  <PwaUpdate />
  <div className="rotate-screen reader-rotate" role="status"><Smartphone size={54} /><h1>Поверните телефон</h1><p>Эта история играется горизонтально.</p></div>
</React.StrictMode>);
