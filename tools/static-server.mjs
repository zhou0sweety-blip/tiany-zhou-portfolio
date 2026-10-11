#!/usr/bin/env node
/* ============================================================
   零依赖静态服务器（只用 Node 内置模块，不装任何 npm 包）
   ------------------------------------------------------------
   用途：本地预览 / 让需要 Node 运行时的部署平台能直接跑起来
   用法： node tools/static-server.mjs [端口]
          npm start            （等价，端口取 PORT 环境变量，默认 8080）
   服务目录： portfolio/（站点入口 index.html 所在目录）
   ============================================================ */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../portfolio', import.meta.url)));
const PORT = Number(process.env.PORT || process.argv[2] || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function resolveTarget(urlPath) {
  let p = resolve(join(ROOT, urlPath));
  // 防目录穿越
  if (p !== ROOT && !p.startsWith(ROOT + sep)) return null;
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (existsSync(p)) return p;
  // 单页应用兜底：无扩展名路径回落到入口页
  if (!extname(urlPath) && existsSync(join(ROOT, 'index.html'))) return join(ROOT, 'index.html');
  return null;
}

const server = createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 Bad Request');
  }

  const file = resolveTarget(urlPath);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`404 Not Found: ${urlPath}`);
  }

  const ext = extname(file).toLowerCase();
  const size = statSync(file).size;
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  const shown = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`静态站点已启动  →  http://${shown}:${PORT}/`);
  console.log(`服务目录: ${ROOT}`);
  console.log('停止：Ctrl + C');
});
