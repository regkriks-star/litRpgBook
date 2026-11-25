import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(file => file.isFile() && file.name !== 'sw.js' && !file.name.endsWith('.map'))
  .map(file => `${file.parentPath}/${file.name}`.replace(/^dist\//, '')).sort();
const hash = createHash('sha256').update(await readFile(new URL(import.meta.url)));
for (const file of files) hash.update(file).update(await readFile(`dist/${file}`));
const version = hash.digest('hex').slice(0, 16);
await writeFile('dist/sw.js', `
const ROOT = self.registration.scope;
const PREFIX = 'lazy-courage:' + new URL(ROOT).pathname + ':';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(files)}.map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(ROOT)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const url = event.request.mode === 'navigate' ? new URL('index.html', ROOT).href : event.request;
    // Only static local files are precached; Vary: Origin differs for module requests.
    return await cache.match(url, { ignoreSearch: true, ignoreVary: true }) || fetch(event.request);
  })());
});
`);
console.log(`PWA: ${files.length} local files precached, version ${version}`);
