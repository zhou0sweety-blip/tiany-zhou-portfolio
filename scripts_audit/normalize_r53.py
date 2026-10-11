# -*- coding: utf-8 -*-
"""R53 全站一致性规范化：字体系统 / 配色 / 动效
只改 <style> 块，且跳过 :root 令牌定义块与 CSS 注释。
"""
import re, sys, shutil, os

P = r'F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project/portfolio/index.html'
BAK = P + '.r53bak'
s = open(P, encoding='utf-8').read()
if not os.path.exists(BAK):
    shutil.copy2(P, BAK)

stat = {}

def bump(k, n=1):
    stat[k] = stat.get(k, 0) + n

# ---------- 受保护区：:root 块 + 所有注释 ----------
protected = []
m = re.search(r':root\{(?:[^{}]*)\}', s)
if m:
    protected.append((m.start(), m.end()))
for m in re.finditer(r'/\*.*?\*/', s, re.S):
    protected.append((m.start(), m.end()))

# 只看 <style> 块
style_spans = [(m.start(1), m.end(1)) for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]

def in_scope(i):
    if not any(a <= i < b for a, b in style_spans):
        return False
    return not any(a <= i < b for a, b in protected)

def sub(pat, repl, src, key, flags=0):
    out, last, n = [], 0, 0
    for m in re.finditer(pat, src, flags):
        if not in_scope(m.start()):
            continue
        out.append(src[last:m.start()])
        out.append(repl(m) if callable(repl) else m.expand(repl))
        last = m.end()
        n += 1
    out.append(src[last:])
    bump(key, n)
    return ''.join(out)

# ============ 1. 配色：令牌重复写死 → var()；遗留冷蓝黑 → 暖中性 ============
COLOR_MAP = {
    '#F5F5F5': 'var(--text)', '#f5f5f5': 'var(--text)',
    '#A0A0A0': 'var(--text-soft)', '#a0a0a0': 'var(--text-soft)',
    '#6E6E6E': 'var(--text-mute)', '#6e6e6e': 'var(--text-mute)',
    '#111111': 'var(--bg-tint)',   '#111': 'var(--bg-tint)',
    '#171717': 'var(--surface-2)',
    '#141414': 'var(--surface)',
    '#292929': 'var(--border)',
    '#3D3D3D': 'var(--border-strong)', '#3d3d3d': 'var(--border-strong)',
    '#080808': 'var(--bg)',
    '#1D1D1D': 'var(--sage)', '#1d1d1d': 'var(--sage)',
    '#262626': 'var(--sage-deep)',
    '#FF5B1F': 'var(--k-flame,#FF5B1F)', '#ff5b1f': 'var(--k-flame,#FF5B1F)',
    # 退役冷蓝黑（NUDOT 遗留）→ 暖中性
    '#0A0B0D': 'var(--bg-tint)', '#0C0D0F': 'var(--bg-tint)',
    '#101113': 'var(--surface)', '#1B1D22': 'var(--surface-2)',
    '#0D0D0D': 'var(--bg-tint)', '#101010': 'var(--bg-tint)',
    '#171310': 'var(--bg)',
}
for hexv, tok in COLOR_MAP.items():
    pat = re.escape(hexv) + r'(?![0-9a-fA-F])'
    s = sub(pat, tok, s, 'color')

# ============ 2. 字号：硬编码 px → 令牌 ============
FS_MAP = [
    ('9.5px', 'var(--fs-micro)'), ('10px', 'var(--fs-micro)'), ('10.5px', 'var(--fs-meta)'),
    ('11.5px', 'var(--fs-cap)'), ('11px', 'var(--fs-cap)'),
    ('12.5px', 'var(--fs-label)'), ('12px', 'var(--fs-label)'),
    ('13.5px', 'var(--fs-note)'), ('13px', 'var(--fs-note)'),
    ('15.5px', 'var(--fs-body)'), ('15px', 'var(--fs-body)'), ('14px', 'var(--fs-body)'),
    ('16px', 'var(--fs-body)'), ('17px', 'var(--fs-lead)'),
]
for px, tok in FS_MAP:
    pat = r'(font-size\s*:\s*)' + re.escape(px) + r'\b'
    s = sub(pat, lambda m: m.group(1) + tok, s, 'font-size')

# ============ 3. 行高：20 档 → 5 档 ============
LH_MAP = {'1': 'var(--lh-1)', '1.02': 'var(--lh-tight)', '1.08': 'var(--lh-tight)',
          '1.1': 'var(--lh-tight)', '1.12': 'var(--lh-tight)', '1.14': 'var(--lh-tight)',
          '1.16': 'var(--lh-tight)', '1.2': 'var(--lh-snug)', '1.3': 'var(--lh-snug)',
          '1.45': 'var(--lh-mid)', '1.5': 'var(--lh-mid)', '1.6': 'var(--lh-mid)',
          '1.7': 'var(--lh-mid)', '1.75': 'var(--lh-body)', '1.8': 'var(--lh-body)',
          '1.85': 'var(--lh-body)', '1.9': 'var(--lh-body)', '1.95': 'var(--lh-body)',
          '2': 'var(--lh-body)'}
for num, tok in LH_MAP.items():
    pat = r'(line-height\s*:\s*)' + re.escape(num) + r'(?![\d.])'
    s = sub(pat, lambda m: m.group(1) + tok, s, 'line-height')

# ============ 4. 字重：CSS 里 700 → 600（DM Sans 未加载 700，避免伪粗）============
s = sub(r'(font-weight\s*:\s*)700\b', lambda m: m.group(1) + '600', s, 'font-weight')

# ============ 5. 动效：时长令牌化 + 缓动统一 var(--ease) ============
def split_top(v):
    """按顶层逗号切分（括号内的逗号不算）"""
    parts, depth, cur = [], 0, ''
    for ch in v:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return parts

def tier(prop, dur_s):
    d = float(dur_s)
    if d >= 1.0: return 'dur-5'
    if d >= 0.85: return 'dur-6' if 'opacity' in prop else 'dur-4'
    if d >= 0.65: return 'dur-4'
    if d >= 0.5:  return 'dur-3'
    if d >= 0.4:  return 'dur-2'
    return 'dur-1'

def fix_transition(val):
    if val.strip() in ('none', 'none !important'):
        return val
    parts = split_top(val)
    out = []
    for p in parts:
        raw = p.strip()
        if not raw:
            continue
        # 缓动统一
        new = re.sub(r'cubic-bezier\([^)]*\)', 'var(--ease)', raw)
        new = re.sub(r'(?<![-\w])(?:ease-in-out|ease-out|ease-in|ease|linear)(?![-\w])', 'var(--ease)', new)
        # 时长令牌化
        def dur_rep(m):
            prop = new.split()[0] if new.split() else ''
            return 'var(--%s)' % tier(prop, m.group(1))
        new = re.sub(r'(?<![\w.\-])(\d*\.?\d+)s\b', dur_rep, new)
        # 末尾缺缓动则补
        if 'var(--ease)' not in new:
            new = new + ' var(--ease)'
        out.append(new.strip())
    return ', '.join(out)

s = sub(r'(transition\s*:\s*)([^;}]+)', lambda m: m.group(1) + fix_transition(m.group(2)), s, 'transition')

# ============ 6. 写入新令牌 ============
TOK_ANCHOR = '  --ease:cubic-bezier(.22,.61,.36,1);'
NEW_TOK = '''  --ease:cubic-bezier(.22,.61,.36,1);
  /* —— R53 动效时长梯度（缓动全站单一 --ease）——
     1 微交互（颜色/边框/背景/透明度/间距）.3s · 2 组件（按钮/卡片/图标）.45s
     3 面板/弹层/淡入 .5s · 4 媒体推镜·卡片级 .8s · 5 媒体推镜·主图级 1.1s
     6 入场揭示 .9s —— */
  --dur-1:.3s; --dur-2:.45s; --dur-3:.5s;
  --dur-4:.8s; --dur-5:1.1s; --dur-6:.9s;
  /* —— R53 行高梯度（原 20 档收敛为 5 档）—— */
  --lh-1:1; --lh-tight:1.12; --lh-snug:1.3; --lh-mid:1.6; --lh-body:1.85;'''
if TOK_ANCHOR in s:
    s = s.replace(TOK_ANCHOR, NEW_TOK, 1)
    bump('tokens', 1)

# ============ 7. 字号令牌重调（桌面端与既有硬编码值对齐）============
RETUNE = [
    ('--fs-label:clamp(10px,.8vw,12px);', '--fs-label:clamp(12px,.86vw,12.5px);'),
    ('--fs-cap:clamp(11px,.82vw,12px);', '--fs-cap:clamp(11px,.80vw,11.5px);'),
    ('--fs-meta:clamp(10px,.8vw,11px);', '--fs-meta:clamp(10px,.76vw,10.5px);'),
]
for a, b in RETUNE:
    if a in s:
        s = s.replace(a, b, 1)
        bump('retune', 1)
# 新增 micro / note 两档（插在 fs-meta 前）
META_ANCHOR = '  --fs-meta:clamp(10px,.76vw,10.5px);'
if META_ANCHOR in s:
    s = s.replace(META_ANCHOR,
                  '  --fs-micro:clamp(9.5px,.70vw,10px);   /* 极微：角标 / 编号 / 版权 */\n'
                  '  --fs-meta:clamp(10px,.76vw,10.5px);  /* 元信息 10–10.5 */', 1)
    bump('fs-micro', 1)
NOTE_ANCHOR = '  --fs-body:clamp(14px,1.05vw,16px);'
if NOTE_ANCHOR in s:
    s = s.replace(NOTE_ANCHOR,
                  '  --fs-note:clamp(13px,.94vw,13.5px);  /* 说明 / 次段落 13–13.5 */\n'
                  '  --fs-body:clamp(14px,1.05vw,16px);', 1)
    bump('fs-note', 1)

# ============ 8. 字体加载：补齐实际用到的字重，去掉未用的 700 ============
OLD_URL = 'family=DM+Sans:wght@400;500;600&amp;family=Noto+Sans+SC:wght@400;500;700&amp;family=Noto+Serif+SC:wght@400;600'
NEW_URL = 'family=DM+Sans:wght@400;500;600&amp;family=Noto+Sans+SC:wght@400;500;600&amp;family=Noto+Serif+SC:wght@400;600'
if OLD_URL in s:
    s = s.replace(OLD_URL, NEW_URL, 1)
    bump('font-url', 1)

open(P, 'w', encoding='utf-8').write(s)
print('备份:', BAK)
for k, v in stat.items():
    print(f'  {k:<12} {v}')
