/* ============================================================
   素材替换后台 · 本地服务（零依赖，只需要 Node）
   用法： node server.js [端口]     默认 5273
   作用：左侧清单 + 上传图片/视频 -> 写入 portfolio/assets/media
        并重写 portfolio/assets/overrides.js，站点无需改动即可显示新素材
   ============================================================ */
'use strict';
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ADMIN = __dirname;
const ROOT  = path.resolve(ADMIN, '..');
const SITE  = path.join(ROOT, 'portfolio');
const PUB   = path.join(ADMIN, 'public');
const BKP   = path.join(ADMIN, '_backup');
const CFG   = JSON.parse(fs.readFileSync(path.join(ADMIN, 'slots.json'), 'utf8'));
const STATE = path.join(ADMIN, 'state.json');
const OVR   = path.join(SITE, 'assets', 'overrides.js');
const PORT  = Number(process.argv[2] || 5273);

const HEADER = [
  '/* ============================================================',
  '   站点覆盖配置 —— 由 admin 后台自动生成，也可手改。',
  '   MEDIA_OVERRIDES   : 图片槽位 id -> 图片路径（相对 index.html）',
  '   HERO_BG_OVERRIDE  : 首页 Hero 底图 / 视频的配置改写',
  '   COPY_OVERRIDES    : 文案槽位 key -> 新文案',
  '   PROJECT_OVERRIDES : "项目id.字段" -> 新文案（title/label/year/desc/result...）',
  '   清空某一项请到后台点「还原默认」，或直接删掉下面对应的一行。',
  '   ============================================================ */'
].join('\n');

const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.avif':'image/avif', '.gif':'image/gif', '.svg':'image/svg+xml',
  '.mp4':'video/mp4', '.webm':'video/webm', '.ico':'image/x-icon'
};
const mime = f => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';

/* ---------- 状态读写 ---------- */
/* 从 overrides.js 里按块名反解对象，避免覆盖手工改动 */
function blockOf(txt, name){
  const m = new RegExp('window\\.' + name + '\\s*=\\s*\\{([\\s\\S]*?)\\};').exec(txt);
  if (!m) return {};
  const out = {}, re = /"?([A-Za-z0-9_.$\-]+)"?\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let x;
  while ((x = re.exec(m[1]))) { try { out[x[1]] = JSON.parse('"' + x[2] + '"'); } catch (e) {} }
  return out;
}

function readState(){
  let st = {};
  if (fs.existsSync(STATE)) {
    try { const s = JSON.parse(fs.readFileSync(STATE, 'utf8'));
          if (s && typeof s === 'object') st = s; } catch (e) {}
  }
  /* 首次运行 / 缺字段：从已有的 overrides.js 里反解出来 */
  if (fs.existsSync(OVR)) {
    const txt = fs.readFileSync(OVR, 'utf8');
    if (!Object.keys(st).length) {
      const media = blockOf(txt, 'MEDIA_OVERRIDES');
      Object.keys(media).forEach(id => { if (cfgOf(id)) st[id] = { path: media[id] }; });
      const hero = blockOf(txt, 'HERO_BG_OVERRIDE');
      if ((hero.kind === 'image') && hero.image) st['hero-image'] = { path: hero.image };
      if (hero.kind && hero.kind !== 'image' && hero.video) st['hero-video'] = { path: hero.video };
    }
    if (!st.__copy)     st.__copy     = blockOf(txt, 'COPY_OVERRIDES');
    if (!st.__projects) st.__projects = blockOf(txt, 'PROJECT_OVERRIDES');
  }
  if (!st.__copy) st.__copy = {};
  if (!st.__projects) st.__projects = {};
  return st;
}
const writeState = st => fs.writeFileSync(STATE, JSON.stringify(st, null, 1), 'utf8');
const cfgOf = id => CFG.slots.find(s => s.id === id);

function applyOverrides(st){
  const map = {}, hero = {};
  Object.keys(st).forEach(id => {
    if (id.indexOf('__') === 0) return;                 /* __copy / __projects 走另一段 */
    const c = cfgOf(id); if (!c) return;
    if (c.kind === 'override')    map[id] = st[id].path;
    if (c.kind === 'hero-image'){ hero.kind = 'image'; hero.image = st[id].path; delete hero.video; }
    if (c.kind === 'hero-video'){ hero.kind = 'video-loop'; hero.video = st[id].path;
                                  hero.fallback = st[id].path; delete hero.image; }
  });
  const lines = o => Object.keys(o)
    .map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(o[k])},`).join('\n');
  fs.writeFileSync(OVR,
    `${HEADER}\nwindow.MEDIA_OVERRIDES = {\n${lines(map)}\n};\n\n` +
    `window.HERO_BG_OVERRIDE = {\n${lines(hero)}\n};\n\n` +
    `window.COPY_OVERRIDES = {\n${lines(st.__copy || {})}\n};\n\n` +
    `window.PROJECT_OVERRIDES = {\n${lines(st.__projects || {})}\n};\n`, 'utf8');
}

/* ---------- multipart ---------- */
function parseMultipart(buf, boundary){
  const parts = [];
  const delim = Buffer.from('--' + boundary);
  let idx = buf.indexOf(delim);
  while (idx !== -1){
    const head = idx + delim.length + 2;
    let end = buf.indexOf(delim, head);
    if (end === -1) break;
    const chunk = buf.slice(head, end - 2);
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep !== -1){
      const h = chunk.slice(0, sep).toString('utf8');
      parts.push({
        name: ( (/name="([^"]+)"/.exec(h)) || [] )[1],
        filename: ( (/filename="([^"]+)"/.exec(h)) || [] )[1],
        type: ( (/Content-Type:\s*([^\r\n]+)/.exec(h)) || [] )[1],
        data: chunk.slice(sep + 4)
      });
    }
    idx = end;
    if (buf.slice(idx, idx + delim.length).equals(delim)) idx = end; else idx = buf.indexOf(delim, end);
  }
  return parts;
}
const EXT = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif',
              'image/svg+xml':'svg','image/gif':'gif','video/mp4':'mp4','video/webm':'webm' };

/* ---------- HTTP ---------- */
const json = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};
const fileOut = (res, file) => {
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('404 ' + file); return; }
    res.writeHead(200, { 'Content-Type': mime(file), 'Cache-Control': 'no-store' });
    res.end(d);
  });
};

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  const p = u.pathname;

  if (p === '/' || p === '/index.html') return fileOut(res, path.join(PUB, 'index.html'));
  if (p === '/app.js')   return fileOut(res, path.join(PUB, 'app.js'));
  if (p === '/style.css')return fileOut(res, path.join(PUB, 'style.css'));

  if (p === '/api/slots'){
    const st = readState();
    const slots = CFG.slots.map(s => {
      const cur = st[s.id];
      const isFile = s.kind === 'file';
      const rel = cur ? cur.path : (isFile ? s.path : null);
      const abs = rel ? path.join(SITE, rel) : null;
      return Object.assign({}, s, {
        current: rel, preview: rel ? '/site/' + rel : null,
        custom: !!cur, size: (abs && fs.existsSync(abs)) ? fs.statSync(abs).size : null
      });
    });
    return json(res, 200, {
      port: PORT, site: CFG.site, mediaDir: CFG.mediaDir,
      siteOk: fs.existsSync(path.join(SITE, 'index.html')), slots
    });
  }

  if (p === '/api/upload' && req.method === 'POST'){
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const b = /boundary=(?:"([^"]+)"|([^;]+))/.exec(req.headers['content-type'] || '');
      if (!b) return json(res, 400, { error: '缺少 boundary' });
      const parts = parseMultipart(buf, b[1] || b[2]);
      const slotId = ((parts.find(x => x.name === 'slot') || {}).data || '').toString('utf8').trim();
      const file   = parts.find(x => x.name === 'file');
      const cfg = cfgOf(slotId);
      if (!cfg) return json(res, 400, { error: '未知槽位 ' + slotId });
      if (!file || !file.data.length) return json(res, 400, { error: '没有收到文件' });

      const declared = (path.extname(file.filename || '') || '').toLowerCase().slice(1);
      const ext = declared || EXT[(file.type || '').trim()] || (cfg.ext || ['png'])[0];
      if (cfg.ext && cfg.ext.length && !cfg.ext.includes(ext)) {
        return json(res, 400, { error: `不支持 .${ext}，请上传 ${cfg.ext.join(' / ')}` });
      }

      let rel;
      if (cfg.kind === 'file'){
        rel = cfg.path;
        const absOrig = path.join(SITE, rel);
        const bak = path.join(BKP, path.basename(rel));
        if (fs.existsSync(absOrig) && !fs.existsSync(bak)){
          fs.mkdirSync(BKP, { recursive: true });
          fs.copyFileSync(absOrig, bak);          /* 首次覆盖前备份原占位文件 */
        }
      } else {
        rel = `${CFG.mediaDir}/${slotId}.${ext}`;
      }
      const abs = path.join(SITE, rel);
      try {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, file.data);
      } catch (e){ return json(res, 500, { error: '写入失败：' + e.message }); }

      const st = readState();
      st[slotId] = { path: rel, at: Date.now(), name: file.filename || '' };
      writeState(st); applyOverrides(st);
      return json(res, 200, { ok: true, slot: slotId, path: rel, preview: '/site/' + rel });
    });
    return;
  }

  if (p === '/api/reset' && req.method === 'POST'){
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let slotId = '';
      try { slotId = (JSON.parse(body || '{}').slot || '').trim(); } catch (e) {}
      const cfg = cfgOf(slotId);
      if (!cfg) return json(res, 400, { error: '未知槽位' });
      const st = readState();
      const cur = st[slotId];
      if (cur){
        const abs = path.join(SITE, cur.path);
        if (cfg.kind !== 'file' && fs.existsSync(abs)) { try { fs.unlinkSync(abs); } catch (e) {} }
        if (cfg.kind === 'file'){
          const bak = path.join(BKP, path.basename(cfg.path));
          if (fs.existsSync(bak)) { try { fs.copyFileSync(bak, abs); } catch (e) {} }
        }
        delete st[slotId];
      }
      writeState(st); applyOverrides(st);
      return json(res, 200, { ok: true, slot: slotId });
    });
    return;
  }

  /* ---------- 文案：读取 / 保存 ---------- */
  if (p === '/api/copy'){
    if (req.method === 'GET'){
      const st = readState();
      return json(res, 200, { copy: st.__copy || {}, projects: st.__projects || {} });
    }
    if (req.method === 'POST'){
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        let b = {};
        try { b = JSON.parse(body || '{}'); } catch (e) { return json(res, 400, { error: 'JSON 解析失败' }); }
        const st = readState();
        const merge = (box, patch) => {
          Object.keys(patch || {}).forEach(k => {
            const v = patch[k];
            if (v === null || v === '') delete box[k];   /* 传 null/空串 = 还原默认 */
            else box[k] = v;
          });
        };
        if (b.all) { st.__copy = {}; st.__projects = {}; }          /* 全部还原 */
        if (b.copy)     { st.__copy     = Object.assign({}, st.__copy || {});     merge(st.__copy, b.copy); }
        if (b.projects) { st.__projects = Object.assign({}, st.__projects || {}); merge(st.__projects, b.projects); }
        writeState(st); applyOverrides(st);
        return json(res, 200, { ok:true, copy: st.__copy, projects: st.__projects });
      });
      return;
    }
    return json(res, 405, { error: 'method not allowed' });
  }

  if (p.indexOf('/site/') === 0 || p === '/site'){
    const rel = p === '/site' ? '/index.html' : p.slice('/site'.length);
    const abs = path.join(SITE, decodeURIComponent(rel));
    if (!abs.startsWith(SITE) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()){
      if (rel === '/index.html') { res.writeHead(404); return res.end('site not found: ' + abs); }
      const idx = path.join(SITE, 'index.html');          /* hash 路由回落到首页 */
      return fs.existsSync(idx) ? fileOut(res, idx) : (res.writeHead(404), res.end('404'));
    }
    return fileOut(res, abs);
  }

  res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
  res.end('404 ' + p);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  Portfolio media admin');
  console.log('  ------------------------------------------');
  console.log('  后台   http://127.0.0.1:' + PORT + '/');
  console.log('  站点   http://127.0.0.1:' + PORT + '/site/index.html');
  console.log('  站点目录 ' + SITE);
  console.log('  素材目录 ' + path.join(SITE, CFG.mediaDir));
  console.log('');
  console.log('  停止服务：在这个窗口按 Ctrl+C');
  console.log('');
});
