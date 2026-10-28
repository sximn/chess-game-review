import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const assets = [];
function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const file = path.join(dir, e.name);
		if (e.isDirectory()) walk(file);
		else if (!/\.map$|\.br$|\.gz$|service-worker\.js$/.test(file))
			assets.push('/' + path.relative('build', file).split(path.sep).join('/'));
	}
}
walk('build');
assets.sort();
const hash = crypto.createHash('sha256');
for (const a of assets) {
	hash.update(a);
	hash.update(fs.readFileSync('build' + a));
}
const cache = 'upapawn-shell-' + hash.digest('hex').slice(0, 16);
fs.writeFileSync(
	'build/service-worker.js',
	`
const CACHE=${JSON.stringify(cache)}, ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('upapawn-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate') {event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;}
 if(!ASSETS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request)));
});
`
);
console.log('Offline shell prepared:', assets.length, 'assets');
