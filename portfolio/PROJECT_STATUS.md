# PROJECT STATUS · 设计进度与待办

> 记录时间：2026-10-10
> 站点形态：单文件 SPA（`portfolio/index.html`，9,529 行 / 654 KB），hash 路由，原生 JS，零依赖
> 线上版本：https://sweety-zhou.app.workbuddy.host/ （已同步至 R31）

---

## 一、当前视觉方向：高级黑色系（Dark Editorial）

2026-10-10 完成全站视觉重塑，方向为 **Dark Editorial / Luxury Design Studio / Cinematic / Minimal / High Contrast / Immersive Motion**。

| 用途 | 色值 |
|---|---|
| 主背景 | `#080808` |
| 模块交替背景 | `#111111` / `#171717` |
| 主标题 | `#F5F5F5` |
| 辅助文字 | `#A0A0A0` |
| 分隔线 | `#292929` |

- 强调色按各项目原有视觉少量使用（如卡塔的焰橙 `--k-flame`），**未额外添加暖金装饰**
- 已**退役主题切换**：移除 `data-theme` / localStorage 偏好逻辑与切换按钮，站点只有单一暗色主题
- 浅色「标本板」是刻意保留的设计手法：深墨素材（亲气球字标 SVG、白底规范图）嵌在暗色页面里时给浅底衬板，保证可读

---

## 二、页面与项目清单

**页面**：`#/` 首页 · `#/work` · `#/about` · `#/contact` · `#/project/<id>`

**9 个项目条目**：

| # | id | 名称 | 类型 | 素材装配状态 |
|---|---|---|---|---|
| 01 | `clapoclap` | Clap o clap | Product Visual | ✅ 真实素材（`media/clapoclap-*`，含 6/7 号新增卡，7 号为 GIF 动图） |
| 02 | `rarebeauty` | Rare Beauty | 3D Rendering | ✅ 真实素材（kv / oth / dir 四宫格 + 渲染动画 mp4） |
| 03 | `qinqiqiu` | 亲气球 | Brand Identity & Packaging | ✅ 真实素材（`images/qq-*` 全套：品牌影像、应用、字格规范、包装、商详长图） |
| 04 | `kata` | 卡塔 | Brand & Product Visual | ✅ 三章结构完成，41 张真实素材 + **1 个占位框**（详见下节） |
| 05 | `expo` | 品牌展会 | Exhibition & Event | ✅ 真实素材（`media/expo-*` 全套） |
| 06 | `merch` | 品牌周边礼品 | Brand Merchandise | ✅ 真实素材（`media/merch-*` 全套） |
| 07 | `atelier` | Atelier Nine | Brand Identity | ⚠️ 演示条目，素材库无对应素材（以 CSS 概念插画呈现） |
| 08 | `halo` | Halo | Web Design | ⚠️ 同上 |
| 09 | `dusk` | Bloom — Volume II | Visual Campaign | ⚠️ 同上 |

---

## 三、卡塔项目详情页（当前结构）

2026-10-10 完成从「零碎排版」到**三章叙事骨架 + 真实素材**的重构：

- **01 BRAND IDENTITY · 品牌识别**（纸色段）—— 品牌故事（车内高温场景实拍）→ 品牌色彩（五色板真实渲染，**色彩规范图仍为占位框**）→ 品牌 IP（卡塔龙主视觉 + 五款变装阵列）
- **02 PRODUCT & PACKAGING · 产品与包装**（墨色段）—— 产品系列六宫格（滑动 Gallery）→ 结构爆炸图（12 零件装配工序）→ 包装体系六件（滑动 Gallery）
- **03 BRAND APPLICATION · 品牌应用**（纸色段）—— 电商详情页（**三台手机机身框，长图在屏幕内上下滑动**）→ 线上营销（**静态四联卡**：品牌首屏 / 质感区 / 主张区 / 系列陈列区）+ 推广与主图 Gallery（2 分段 + 6 主图）→ 线下 POSM（7 件混合比例 Gallery）

**交互组件**：水平滑动 Gallery（scroll-snap + 圆点分页 + 左右箭头 + N/N 计数器 + 键盘方向键）、手机机身框（原生 overflow 滚动 + 隐藏滚动条 + 灵动岛 + 上下渐隐 + 「上下滑动」提示）、吸顶目录高亮 + 阅读进度线。

**页面高度**：从重构前 13,391px → 当前约 9,300px（压缩约 30%，含 gallery 合并与间距收紧）。

---

## 四、迭代记录（近期）

| 轮次 | 内容 |
|---|---|
| R24 | 全站高级黑色系重塑：token 重写、主题切换退役、暖金装饰清除、clapoclap 浅紫底残留修复、亲气球深墨素材可读性修复 |
| R25 | 卡塔页三章骨架重构（01 品牌识别 / 02 产品与包装 / 03 品牌应用），旧图全部替换为标注用途的中性占位框 |
| R25b | 42 个占位框合并为 7 个水平滑动 Gallery，页面高度压缩 31%；修圆点跳转与计数器末尾检测 |
| R26–R27 | 占位框微调、线上营销段比例修正（首页全宽 16:9 + 推广两分段并排） |
| R28 | 真实素材替换：按缩略图总览逐张识别 `assets/images/kata/` 62 个素材并逐格映射（41/42 完成） |
| R29 | 修图片卡编号角标定位、Wordmark 黑底素材标本板回退 |
| R30 | 按用户指定删除两块内容：包装 Gallery 的「07 · STACK 彩盒堆头」、整个「Logo System」小节 |
| R31 | 电商详情页三竖屏 → **手机机身框（屏幕内上下滑动）**；店铺首页 Gallery → **静态四联卡** |

更早的 R15–R23 已完成：全站暖白统一、品牌周边⇄展会板块互换、raggededge 曲线底边动效移植、Hero 中文文案替换等。

---

## 五、待办 / 未完成

1. **卡塔「色彩规范图」**仍是占位框（素材库无对应规范图），需要补一张品牌色盘使用规则图 → 槽位在 01 章品牌色彩小节
2. **卡塔素材库未上页**（已保留在 `assets/images/kata/`，可按需补充到各章）：
   `kata-wind-photo-01/02/03`、`kata-torch-photo-01…05`、`kata-xbanner-01/02`、`kata-posm-02 / 02a / 03 / 03a`、`kata-rl-banner.png`、`kata-ecom-home.jpg`、`kata-phone-01/02/03`
3. **已下线视频**仍留在 `assets/video/_retired/`（`footer-scrub.mp4` 等 3 个），如需清理请确认后再删
4. **后台槽位未覆盖卡塔页**：卡塔页图片路径硬编码在 `index.html` 内（`K + 文件名`），不在 `admin/slots.json` 的槽位机制里，改图需直接改代码或替换同名文件
5. `atelier` / `halo` / `dusk` 三个演示条目尚无真实素材，如要保留展示需补素材，否则可考虑下架

---

## 六、素材与体积统计

| 项目 | 数据 |
|---|---|
| `portfolio/` 合计 | 347 文件 / 235.5 MB（含历史备份） |
| `assets/` 素材 | 291 文件 / 201.7 MB |
| 格式分布 | jpg 226 · png 37 · gif 16 · mp4 6 · svg 5 · js 1 |
| 最大单文件 | `assets/images/kata/kata-posm-02a.jpg`（16.9 MB） |
| 素材目录 | images 187（archive 64 / kata 62 / 备份 16 / 根 45）· media 93 · video 6 · icons 3 |
| 引用完整性 | 70 条路径 + 851 个文件名 **零缺失** |

---

## 七、已知技术债 / 建议

1. **项目根目录堆积 41 个历史 HTML**（15 个 `index.html.bak-*` + 26 个 `index-pre-*.html`，约 28 MB）—— 建议归档到 `_archive/` 或移出项目目录（本次打包已排除，但原目录仍在）
2. **`index.html` 单文件已 9,529 行** —— 继续扩展前建议先拆分模块或引入构建链（拆分会破坏「file:// 直接打开」的特性，需权衡）
3. **Google Fonts 是唯一外部依赖** —— 若需完全离线，可下载字体文件到 `assets/fonts/` 并改用 `@font-face`
4. 全站图片总量 200 MB，首屏之外的懒加载已启用；若上线带宽敏感，建议再做一轮图片压缩（大量 jpg 为 4K 级原图）
