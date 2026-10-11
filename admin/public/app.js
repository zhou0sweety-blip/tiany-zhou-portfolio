(() => {
  const $  = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const kb = n => n == null ? '' : (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB');

  let data = null;
  let curRoute = '#/home';

  const toast = (msg, bad) => {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast is-on' + (bad ? ' is-bad' : '');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => { t.className = 'toast' + (bad ? ' is-bad' : ''); }, 2600);
  };

  /* ============================================================
     一、图片 / 视频
     ============================================================ */
  function thumb(s) {
    if (!s.preview) return `<div class="thumb${s.contain ? ' thumb--sq' : ''}">占位</div>`;
    if (s.kind === 'hero-video')
      return `<div class="thumb"><video src="${esc(s.preview)}" muted playsinline></video></div>`;
    return `<div class="thumb${s.contain ? ' thumb--sq' : ''}"><img src="${esc(s.preview)}" alt=""></div>`;
  }

  function card(s) {
    const kindLabel = { override:'配图槽位', 'hero-image':'Hero 底图', 'hero-video':'Hero 视频', file:'文件覆盖' }[s.kind] || s.kind;
    return `<div class="card${s.custom ? ' has' : ''}" data-id="${esc(s.id)}">
      ${thumb(s)}
      <div class="body">
        <div class="body__t">
          <span class="name">${esc(s.name)}</span>
          <span class="tag">${esc(kindLabel)}</span>
          <span class="tag ${s.visible === false ? 'is-off' : 'is-on'}">${s.visible === false ? '暂未渲染' : '当前可见'}</span>
        </div>
        <div class="meta">
          建议 <b>${esc(s.recommend)}</b> · 比例 ${esc(s.ratio)} · 桌面 ${esc(s.desktop)} / 移动 ${esc(s.mobile)}<br>
          <span class="st ${s.custom ? 'is-on' : ''}">${s.custom
            ? '已替换：' + esc(s.current) + (s.size ? ' · ' + kb(s.size) : '')
            : (s.kind === 'file' ? '当前：' + esc(s.path) : '当前：CSS 概念插画')}</span>
        </div>
        <div class="acts">
          <label class="up"><input type="file" accept="${esc((s.ext || []).map(e => '.' + e).join(','))}"><span>上传替换</span></label>
          <button class="del"${s.custom ? '' : ' disabled'}>移除</button>
          <span class="st">支持 ${esc((s.ext || []).join(' / '))}</span>
        </div>
      </div>
    </div>`;
  }

  function renderMedia() {
    $('#st-site').textContent = data.siteOk ? '站点已就绪' : '找不到站点 index.html';
    $('#st-site').className = 'pill' + (data.siteOk ? '' : ' is-bad');

    const groups = [];
    data.slots.forEach(s => {
      let g = groups.find(x => x.name === s.group);
      if (!g) { g = { name: s.group, items: [] }; groups.push(g); }
      g.items.push(s);
    });
    $('#groups').innerHTML = groups.map(g => `
      <div class="grp">
        <div class="grp__h"><h2>${esc(g.name)}</h2><span class="grp__n">${g.items.length} 项 · 已替换 ${g.items.filter(i => i.custom).length}</span></div>
        ${g.items.map(card).join('')}
      </div>`).join('');
  }

  async function loadMedia() {
    try { data = await (await fetch('/api/slots', { cache: 'no-store' })).json(); renderMedia(); }
    catch (e) { toast('无法连接后台服务', true); }
  }

  async function upload(card, file) {
    const id = card.dataset.id;
    if (!file) return;
    const fd = new FormData();
    fd.append('slot', id); fd.append('file', file);
    card.style.opacity = '.55';
    try {
      const r = await (await fetch('/api/upload', { method: 'POST', body: fd })).json();
      toast(r.ok ? '已替换 ' + id : (r.error || '上传失败'), !r.ok);
    } catch (e) { toast('上传出错：' + e.message, true); }
    card.style.opacity = '';
    loadMedia();
    const pv = $('#pv'); pv.src = pv.src;
  }

  async function reset(card) {
    const id = card.dataset.id;
    await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ slot: id }) });
    toast('已恢复占位：' + id);
    loadMedia();
    const pv = $('#pv'); pv.src = pv.src;
  }

  document.addEventListener('change', e => {
    const inp = e.target.closest('.up input');
    if (inp) upload(inp.closest('.card'), inp.files[0]);
  });
  document.addEventListener('click', e => {
    const btn = e.target.closest('.del');
    if (btn && btn.classList.contains('f-restore')) return;      /* 文字区的还原按钮走另一套 */
    if (btn && !btn.disabled) reset(btn.closest('.card'));
  });
  ['dragover', 'dragenter'].forEach(ev => document.addEventListener(ev, e => {
    const c = e.target.closest && e.target.closest('.card');
    if (c) { e.preventDefault(); c.classList.add('is-over'); }
  }));
  ['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => {
    const c = e.target.closest && e.target.closest('.card');
    if (c) c.classList.remove('is-over');
  }));
  document.addEventListener('drop', e => {
    const c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    e.preventDefault();
    upload(c, e.dataTransfer.files && e.dataTransfer.files[0]);
  });

  /* ============================================================
     二、文字内容
     ============================================================ */
  const SCAN = ['#/home', '#/work', '#/about', '#/contact'];
  let SLOTS = [], PROJS = [], DEF = {}, EDIT = {}, SAVED = { copy:{}, projects:{} };
  let copyReady = false, saveTm = null;

  const isProjKey = k => k.indexOf('p:') === 0;
  const projKey   = k => k.slice(2);                       /* p:kata.title -> kata.title */
  const isDefault = (k, v) => v === (DEF[k] == null ? '' : DEF[k]);

  function loadPv(url) {
    return new Promise(res => {
      const pv = $('#pv');
      pv.onload = () => setTimeout(res, 220);
      pv.src = url;
    });
  }

  /* 依次访问四个路由，把站点渲染出来的原始文案采集为「默认值」 */
  async function collect() {
    let slots = null, projs = null;
    const defs = {};
    for (let i = 0; i < SCAN.length; i++) {
      await loadPv('/site/index.html?scan=' + i + SCAN[i]);
      const w = $('#pv').contentWindow;
      if (!w || !w.__pf) { toast('站点缺少 __pf 接口，请确认 index.html 已注入文案槽位', true); return null; }
      if (!slots) { slots = w.__pf.slots(); projs = w.__pf.projects(); }
      Object.assign(defs, w.__pf.defaults());
    }
    /* 项目字段也当作槽位：p:<id>.<field> */
    (projs || []).forEach(p => {
      ['title', 'label', 'year', 'en', 'role', 'desc', 'result'].forEach(f => {
        if (p[f] != null) defs['p:' + p.id + '.' + f] = String(p[f]);
      });
    });
    return { slots: slots || [], projs: projs || [], defs };
  }

  async function initCopy() {
    if (copyReady) return;
    $('#copyGroups').className = 'cp-loading';
    $('#copyGroups').textContent = '正在读取站点文案…';
    try {
      const saved = await (await fetch('/api/copy', { cache: 'no-store' })).json();
      SAVED = { copy: saved.copy || {}, projects: saved.projects || {} };
    } catch (e) { SAVED = { copy:{}, projects:{} }; }

    const c = await collect();
    if (!c) { $('#copyGroups').textContent = '读取失败，请刷新页面重试。'; return; }
    SLOTS = c.slots; PROJS = c.projs; DEF = c.defs;

    /* 已保存的覆盖 → 编辑态 */
    EDIT = {};
    Object.keys(SAVED.copy).forEach(k => { EDIT[k] = SAVED.copy[k]; });
    Object.keys(SAVED.projects).forEach(k => { EDIT['p:' + k] = SAVED.projects[k]; });

    copyReady = true;
    renderCopy();
    /* 采集完把预览放回首页 */
    await loadPv('/site/index.html#/home');
    curRoute = '#/home';
    document.querySelectorAll('.chip[data-route]').forEach(x =>
      x.classList.toggle('is-on', x.dataset.route === '#/home'));
    $('#prev-note').textContent = '当前：首页';
  }

  function fieldHTML(key, label, opts) {
    const o = opts || {};
    const def = DEF[key] == null ? '' : DEF[key];
    const val = (key in EDIT) ? EDIT[key] : def;
    const changed = (key in EDIT) && !isDefault(key, EDIT[key]);
    const long = o.multiline || String(def).length > 48;
    const ctl = long
      ? `<textarea rows="${String(def).length > 120 ? 4 : 2}" spellcheck="false">${esc(val)}</textarea>`
      : `<input type="text" value="${esc(val)}" spellcheck="false">`;
    return `<div class="fld${changed ? ' is-changed' : ''}" data-key="${esc(key)}">
      <div class="fld__h">
        <span class="fld__l">${esc(label)}</span>
        ${o.html ? '<span class="tag tag--html">HTML</span>' : ''}
        <button class="f-restore"${changed ? '' : ' disabled'}>还原</button>
      </div>
      ${ctl}
      <div class="fld__def">默认：${esc(def.length > 90 ? def.slice(0, 90) + '…' : def)}</div>
    </div>`;
  }

  function renderCopy() {
    const q = ($('#cp-search').value || '').trim().toLowerCase();
    const box = $('#copyGroups');
    box.className = '';

    const groups = [];
    SLOTS.forEach(s => {
      let g = groups.find(x => x.name === s.group);
      if (!g) { g = { name: s.group, keys: [], route: s.route }; groups.push(g); }
      g.keys.push({ key: s.key, label: s.label, multiline: s.multiline, html: s.mode === 'html' });
    });
    PROJS.forEach(p => {
      groups.push({
        name: `项目 ${p.no} · ${p.title}`, route: 'project',
        keys: [['title','项目标题'],['label','副标题 / 分类'],['year','年份'],['en','英文主要描述'],['role','英文次级描述 / 范围'],['desc','简介'],['result','中文一句重点']]
          .map(([f, l]) => ({ key: 'p:' + p.id + '.' + f, label: l, multiline: f === 'desc' }))
      });
    });

    let shown = 0;
    const html = groups.map(g => {
      const items = g.keys.filter(it =>
        !q || it.label.toLowerCase().includes(q) || it.key.toLowerCase().includes(q) ||
        String(DEF[it.key] || '').toLowerCase().includes(q));
      shown += items.length;
      if (!items.length) return '';
      return `<div class="grp">
        <div class="grp__h"><h2>${esc(g.name)}</h2><span class="grp__n">${items.length} 项 · 已改 ${items.filter(i => (i.key in EDIT) && !isDefault(i.key, EDIT[i.key])).length}</span></div>
        ${items.map(it => fieldHTML(it.key, it.label, it)).join('')}
      </div>`;
    }).join('');

    box.innerHTML = html || '<div class="cp-empty">没有匹配的字段</div>';
    $('#cp-count').textContent = `共 ${shown} 个字段 · 已改 ${Object.keys(EDIT).filter(k => !isDefault(k, EDIT[k])).length}`;

    /* 输入 → 实时预览 + 自动保存 */
    box.querySelectorAll('.fld').forEach(f => {
      const key = f.dataset.key;
      const ctl = f.querySelector('input,textarea');
      const apply = () => {
        const v = ctl.value;
        if (isDefault(key, v)) delete EDIT[key]; else EDIT[key] = v;
        const changed = (key in EDIT) && !isDefault(key, EDIT[key]);
        f.classList.toggle('is-changed', changed);
        f.querySelector('.f-restore').disabled = !changed;
        liveApply(key, v);
        queueSave();
      };
      ctl.addEventListener('input', () => {
        clearTimeout(ctl._t);
        ctl._t = setTimeout(apply, 220);          /* 边打字边预览，但不必每次按键都渲染 */
      });
      ctl.addEventListener('focus', () => gotoRouteOf(key));
      f.querySelector('.f-restore').addEventListener('click', () => {
        ctl.value = DEF[key] == null ? '' : DEF[key];
        delete EDIT[key];
        f.classList.remove('is-changed');
        f.querySelector('.f-restore').disabled = true;
        liveApply(key, DEF[key] == null ? '' : DEF[key]);
        queueSave();
      });
    });
  }

  /* 编辑某个字段时，把预览切到它所在的页面 */
  function gotoRouteOf(key) {
    let route = null;
    if (isProjKey(key)) route = null;                       /* 项目文案在首页 / Work 都能看到 */
    else {
      const s = SLOTS.find(x => x.key === key);
      if (s && s.route) route = '#' + (s.route === 'home' ? '/home' : '/' + s.route);
    }
    if (!route || route === curRoute) return;
    curRoute = route;
    const pv = $('#pv');
    try { pv.contentWindow.location.hash = route; } catch (e) { pv.src = '/site/index.html' + route; }
    document.querySelectorAll('.chip[data-route]').forEach(x => x.classList.toggle('is-on', x.dataset.route === route));
    $('#prev-note').textContent = '当前：' + (document.querySelector('.chip.is-on[data-route]') || {}).textContent;
  }

  function liveApply(key, val) {
    const w = $('#pv').contentWindow;
    if (!w || !w.__pf) return;
    const v = isDefault(key, val) ? null : val;             /* 等于默认 → 传 null 让站点还原原文 */
    try {
      if (isProjKey(key)) w.__pf.previewProjects({ [projKey(key)]: v });
      else w.__pf.previewCopy({ [key]: v });
    } catch (e) { /* 预览页还没就绪时忽略 */ }
  }

  function queueSave() {
    const el = $('#st-save');
    el.textContent = '保存中…'; el.className = 'pill is-busy';
    clearTimeout(saveTm);
    saveTm = setTimeout(doSave, 900);
  }

  async function doSave() {
    const pc = {}, pp = {};
    Object.keys(EDIT).forEach(k => {
      const v = EDIT[k];
      if (isProjKey(k)) { const f = projKey(k); pp[f] = isDefault(k, v) ? null : v; }
      else pc[k] = isDefault(k, v) ? null : v;
    });
    /* 服务端有、本地已被还原的键也要显式删掉 */
    Object.keys(SAVED.copy).forEach(k => { if (!(k in pc)) pc[k] = null; });
    Object.keys(SAVED.projects).forEach(k => { if (!(k in pp)) pp[k] = null; });
    try {
      const r = await (await fetch('/api/copy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy: pc, projects: pp })
      })).json();
      if (!r.ok) throw new Error(r.error || '保存失败');
      SAVED = { copy: r.copy || {}, projects: r.projects || {} };
      const el = $('#st-save');
      el.textContent = '已保存 · ' + new Date().toTimeString().slice(0, 8);
      el.className = 'pill';
    } catch (e) {
      const el = $('#st-save'); el.textContent = '保存失败'; el.className = 'pill is-bad';
      toast('保存失败：' + e.message, true);
    }
  }

  $('#cp-search').addEventListener('input', () => { if (copyReady) renderCopy(); });
  $('#cp-reset-all').addEventListener('click', async () => {
    if (!confirm('把所有文字还原成站点初始文案？此操作会清空 overrides.js 里的文案覆盖。')) return;
    EDIT = {};
    await fetch('/api/copy', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ copy: {}, projects: {}, all: true }) });
    SAVED = { copy:{}, projects:{} };
    renderCopy();
    try { $('#pv').contentWindow.__pf.resetDraft(); } catch (e) {}
    const pv = $('#pv'); pv.src = pv.src;
    toast('已全部还原为初始文案');
    queueSave();
  });

  /* ============================================================
     三、Tab / 预览
     ============================================================ */
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('is-on'));
    t.classList.add('is-on');
    document.querySelectorAll('.pane').forEach(p =>
      p.classList.toggle('is-on', p.dataset.pane === t.dataset.tab));
    if (t.dataset.tab === 'copy') initCopy();
  }));

  document.querySelectorAll('.chip[data-route]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-route]').forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on');
    curRoute = b.dataset.route;
    const pv = $('#pv');
    try {
      if (pv.contentWindow && pv.contentWindow.__pf) pv.contentWindow.location.hash = b.dataset.route;
      else pv.src = '/site/index.html' + b.dataset.route;
    } catch (e) { pv.src = '/site/index.html' + b.dataset.route; }
    $('#prev-note').textContent = '当前：' + b.textContent;
  }));
  $('#reload').addEventListener('click', () => { const pv = $('#pv'); pv.src = pv.src; });

  loadMedia();
})();
