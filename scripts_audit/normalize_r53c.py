# -*- coding: utf-8 -*-
"""R53 收尾：嵌套 var 修复 + 剩余字号/行高令牌化 + 补 3 个令牌（幂等，实时重算保护区）"""
import re

P = r'F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project/portfolio/index.html'
s = open(P, encoding='utf-8').read()
stat = {}

# ---------- 1) 嵌套 var 折叠（在前一步替换中产生） ----------
n1 = s.count('var(--k-flame,var(--k-flame,#FF5B1F))')
s = s.replace('var(--k-flame,var(--k-flame,#FF5B1F))', 'var(--k-flame,#FF5B1F)')
stat['嵌套var折叠'] = n1
other = re.findall(r'var\(--([a-z0-9-]+),\s*var\(--\1[,)]', s)
stat['其他嵌套var'] = len(other)

# ---------- 2) 追加令牌 ----------
anchor = '  --lh-1:1; --lh-tight:1.12; --lh-snug:1.3; --lh-mid:1.6; --lh-body:1.85;'
if anchor in s:
    s = s.replace(anchor,
        '  --lh-1:1; --lh-display:.9; --lh-tight:1.12; --lh-snug:1.3;\n'
        '  --lh-mid:1.6; --lh-body:1.85; --lh-loose:2;', 1)
    stat['lh 令牌补'] = 1
a2 = '  --fs-note:clamp(13px,.94vw,13.5px);  /* 说明 / 次段落 13–13.5 */'
if a2 in s:
    s = s.replace(a2, a2 + '\n  --fs-icon:clamp(17px,1.4vw,20px);    /* 图标字形：箭头 / 关闭 / 徽标符号 */', 1)
    stat['fs-icon 补'] = 1

# ---------- 3) 保护区实时计算 ----------
def scopes():
    styles = [(m.start(1), m.end(1)) for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]
    comments = [(m.start(), m.end()) for m in re.finditer(r'/\*.*?\*/', s, re.S)]
    return styles, comments

def run(pat, fn, key):
    global s
    cnt = 0
    while True:
        styles, comments = scopes()
        def ok(i): return any(a <= i < b for a, b in styles) and not any(a <= i < b for a, b in comments)
        hit = None
        for m in re.finditer(pat, s):
            if not ok(m.start()): continue
            new = fn(m)
            if new != m.group(0):
                hit = (m.start(), m.end(), new); break
        if not hit: break
        s = s[:hit[0]] + hit[2] + s[hit[1]:]
        cnt += 1
        if cnt > 600: break
    stat[key] = cnt

FS = {'9px': 'var(--fs-micro)', '10px': 'var(--fs-micro)', '10.5px': 'var(--fs-meta)',
      '11px': 'var(--fs-cap)', '11.5px': 'var(--fs-cap)',
      '12px': 'var(--fs-label)', '12.5px': 'var(--fs-label)',
      '13px': 'var(--fs-note)', '13.5px': 'var(--fs-note)',
      '14px': 'var(--fs-body)', '15px': 'var(--fs-body)', '15.5px': 'var(--fs-body)',
      '16px': 'var(--fs-body)', '17px': 'var(--fs-lead)',
      '18px': 'var(--fs-icon)', '20px': 'var(--fs-icon)'}
for px, tok in FS.items():
    run(r'font-size\s*:\s*' + re.escape(px) + r'\b',
        lambda m, t=tok: 'font-size:' + t, 'fs:' + px)

LH = {'1': 'var(--lh-1)',
      '.8': 'var(--lh-display)', '.84': 'var(--lh-display)', '.9': 'var(--lh-display)',
      '.94': 'var(--lh-display)', '.95': 'var(--lh-display)',
      '1.02': 'var(--lh-tight)', '1.04': 'var(--lh-tight)', '1.06': 'var(--lh-tight)',
      '1.07': 'var(--lh-tight)', '1.08': 'var(--lh-tight)', '1.09': 'var(--lh-tight)',
      '1.1': 'var(--lh-tight)', '1.12': 'var(--lh-tight)', '1.14': 'var(--lh-tight)',
      '1.15': 'var(--lh-tight)', '1.18': 'var(--lh-tight)',
      '1.22': 'var(--lh-snug)', '1.25': 'var(--lh-snug)', '1.26': 'var(--lh-snug)',
      '1.28': 'var(--lh-snug)', '1.3': 'var(--lh-snug)',
      '1.4': 'var(--lh-mid)', '1.45': 'var(--lh-mid)', '1.5': 'var(--lh-mid)',
      '1.52': 'var(--lh-mid)', '1.55': 'var(--lh-mid)', '1.6': 'var(--lh-mid)',
      '1.62': 'var(--lh-mid)', '1.65': 'var(--lh-mid)', '1.7': 'var(--lh-mid)',
      '1.75': 'var(--lh-body)', '1.78': 'var(--lh-body)', '1.8': 'var(--lh-body)',
      '1.85': 'var(--lh-body)', '1.9': 'var(--lh-body)',
      '1.92': 'var(--lh-loose)', '1.95': 'var(--lh-loose)', '2': 'var(--lh-loose)',
      '2.05': 'var(--lh-loose)'}
for num, tok in LH.items():
    run(r'line-height\s*:\s*' + re.escape(num) + r'(?![\d.%])',
        lambda m, t=tok: 'line-height:' + t, 'lh:' + num)

open(P, 'w', encoding='utf-8').write(s)
for k, v in stat.items():
    if v: print(f'  {k:<14} {v}')
