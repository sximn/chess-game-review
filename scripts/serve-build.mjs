// Static production preview: no analysis endpoints and no game-content handling.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
const root = path.resolve('build');
const port = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4173;
const mime = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.wasm': 'application/wasm',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain; charset=utf-8'
};
const encoded = new Map();
http
	.createServer((req, res) => {
		try {
			if (!['GET', 'HEAD'].includes(req.method)) {
				res.writeHead(405);
				res.end();
				return;
			}
			const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
			let file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
			if (!file.startsWith(root + path.sep)) {
				res.writeHead(403);
				res.end();
				return;
			}
			if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
				if (!path.extname(pathname) && (req.headers.accept ?? '').includes('text/html'))
					file = path.join(root, 'index.html');
				else {
					res.writeHead(404, { 'Content-Type': 'text/plain' });
					res.end('Not found');
					return;
				}
			}
			const stat = fs.statSync(file);
			const key = file + ':' + stat.mtimeMs;
			let bodies = encoded.get(key);
			if (!bodies) {
				const raw = fs.readFileSync(file);
				bodies = { raw };
				if (raw.length > 1024 && !/\.(png|ico|woff2?|br|gz)$/.test(file)) {
					bodies.br = zlib.brotliCompressSync(raw, {
						params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 }
					});
					bodies.gzip = zlib.gzipSync(raw, { level: 9 });
				}
				encoded.set(key, bodies);
			}
			const accept = req.headers['accept-encoding'] ?? '';
			const encoding =
				bodies.br && accept.includes('br')
					? 'br'
					: bodies.gzip && accept.includes('gzip')
						? 'gzip'
						: null;
			const body = encoding ? bodies[encoding] : bodies.raw;
			res.writeHead(200, {
				'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
				'Content-Length': body.length,
				'Cache-Control':
					pathname.includes('/_app/immutable/') || /engine-[a-f0-9]+\.wasm$/.test(pathname)
						? 'public, max-age=31536000, immutable'
						: 'no-cache',
				Vary: 'Accept-Encoding',
				...(encoding ? { 'Content-Encoding': encoding } : {})
			});
			res.end(req.method === 'HEAD' ? undefined : body);
		} catch {
			res.writeHead(500);
			res.end('Static asset error');
		}
	})
	.listen(port, '127.0.0.1', () => console.log(`Static build: http://localhost:${port}`));
