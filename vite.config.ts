import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseSceneChapter, type SceneChapterId } from './src/scene-layout';

function sceneFiles() {
  return { name: 'scene-editor-files', configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use((request, response, next) => {
      const match = request.url?.match(/^\/__scene-editor\/chapter-0([1-5])\.json$/);
      if (!match) return next();
      const origin = request.headers.origin;
      if (request.method !== 'POST' || !origin || origin !== 'http://' + request.headers.host && origin !== 'https://' + request.headers.host || !request.headers['content-type']?.startsWith('application/json')) { response.statusCode = 403; response.end('Недопустимый запрос.'); return; }
      let body = '', tooLarge = false;
      request.on('data', chunk => { if (body.length + chunk.length > 20 * 1024 * 1024) tooLarge = true; if (!tooLarge) body += chunk; });
      request.on('end', async () => {
        if (tooLarge) { response.statusCode = 413; response.end('Файл больше 20 МБ.'); return; }
        try {
          const chapter = Number(match[1]) as SceneChapterId;
          const doc = parseSceneChapter(JSON.parse(body), chapter);
          const path = fileURLToPath(new URL('./src/scenes/chapter-0' + chapter + '.json', import.meta.url));
          const temporary = path + '.' + randomUUID() + '.tmp';
          try { await writeFile(temporary, JSON.stringify(doc, null, 2) + '\n'); await rename(temporary, path); }
          finally { await rm(temporary, { force: true }); }
          response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ saved: true }));
        } catch { response.statusCode = 400; response.end('Не удалось записать JSON главы.'); }
      });
    });
  } };
}

export default defineConfig({
  plugins: [react(), sceneFiles()],
  base: './',
});
