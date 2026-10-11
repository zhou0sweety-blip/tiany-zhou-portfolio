# -*- coding: utf-8 -*-
"""R53 补漏：重算保护区，把剩余未令牌化的 transition 处理掉（幂等）"""
import re

P = r'F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project/portfolio/index.html'
s = open(P, encoding='utf-8').read()

def split_top(v):
    parts, depth, cur = [], 0, ''
    for ch in v:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return parts

def tier(prop, d):
    if d >= 1.0: return 'dur-5'
    if d >= 0.85: return 'dur-6' if 'opacity' in prop else 'dur-4'
    if d >= 0.65: return 'dur-4'
    if d >= 0.5:  return 'dur-3'
    if d >= 0.4:  return 'dur-2'
    return 'dur-1'

def fix(val):
    if val.strip() in ('none', 'none !important'):
        return val
    out = []
    for p in split_top(val):
        raw = p.strip()
        if not raw: continue
        new = re.sub(r'cubic-bezier\([^)]*\)', 'var(--ease)', raw)
        new = re.sub(r'(?<![-\w])(?:ease-in-out|ease-out|ease-in|ease|linear)(?![-\w])', 'var(--ease)', new)
        new = re.sub(r'(?<![\w.\-])(\d*\.?\d+)s\b',
                     lambda m: 'var(--%s)' % tier((new.split() or [''])[0], float(m.group(1))), new)
        if 'var(--ease)' not in new:
            new += ' var(--ease)'
        out.append(' '.join(new.split()))
    return ', '.join(out)

# 重算：style 块 + 注释（每次替换后立即重算）
changed = 0
while True:
    style_spans = [(m.start(1), m.end(1)) for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]
    comments = [(m.start(), m.end()) for m in re.finditer(r'/\*.*?\*/', s, re.S)]
    def ok(i):
        return any(a <= i < b for a, b in style_spans) and not any(a <= i < b for a, b in comments)
    hit = None
    for m in re.finditer(r'(transition\s*:\s*)([^;}]+)', s):
        if not ok(m.start()): continue
        fixed = fix(m.group(2))
        if fixed != m.group(2):
            hit = (m.start(2), m.end(2), fixed); break
    if not hit: break
    s = s[:hit[0]] + hit[2] + s[hit[1]:]
    changed += 1
    if changed > 200: break

open(P, 'w', encoding='utf-8').write(s)
print('补漏 transition:', changed)

# 复核
left = [m.group(1).strip() for m in re.finditer(r'transition\s*:\s*([^;}]+)', s)
        if re.search(r'(?<![\w.\-])\d*\.?\d+s\b', m.group(1)) and 'var(--dur-' not in m.group(1)]
print('仍含裸时长的 transition:', len(left))
for v in left[:10]: print('   ', ' '.join(v.split())[:90])
already = [m.group(1).strip() for m in re.finditer(r'transition\s*:\s*([^;}]+)', s)
           if re.search(r'(?<![\w.\-])\d*\.?\d+s\b', m.group(1))]
print('已令牌化但含数字（如 var(--dur-1) 不含数字，应为 0）:', len(already))
