# SWEETY ZHOU · 个人作品集网站（完整项目）

一个**单文件 SPA 作品集站**：首页 / Work / About / Contact + 9 个项目详情页，全部代码集中在一个 `index.html` 里（约 9,500 行 / 654 KB），使用 hash 路由切换页面。

**技术形态**：原生 JavaScript（模板字符串 + `innerHTML` 渲染）、零 npm 依赖、零构建链、无 React、无需编译。  
→ 克隆到任何机器上，**双击 `portfolio/index.html` 就能跑**。

---

## 一、目录结构

```
Sweety_Zhou_Portfolio_Full_Project/
├── README.md                       ← 本文件
├── PROJECT_STATUS.md               ← 当前设计进度与待办
├── portfolio/                      ← 站点根目录（网站本体）
│   ├── index.html                  站点全部代码：HTML + CSS + 内联 JS（9,529 行）
│   ├── font-system.html            字体规范速查页（独立小页，非主站）
│   └── assets/
│       ├── overrides.js            素材/文案覆盖配置（后台自动生成，也可手改）
│       ├── logo-studio.svg         站点标识
│       ├── images/                 图片素材（187 个文件）
│       │   ├── archive/            设计档案 archive-01…64（含 GIF 动图）
│       │   ├── kata/               卡塔项目素材 62 个（含 photo-orig-backup/ 原图备份）
│       │   ├── qq-*-backup-*/      亲气球素材「替换前原图」备份（4 个目录）
│       │   └── *.jpg / *.png       首页与各项目封面、亲气球全套、二维码、头像等
│       ├── media/                  后台可替换槽位素材 93 个
│       │                           （clapoclap / expo / merch / rarebeauty / qinqiqiu / kata-cover 等）
│       ├── video/                  视频：clapoclap-cover / clapoclap-more-1 / rarebeauty-render
│       │   └── _retired/           已下线的 3 个视频（footer-scrub 等，保留待回滚）
│       └── icons/                  instagram / linkedin / tiktok 图标
└── admin/                          ← 本地内容后台（可选工具，改文字/换图用）
    ├── server.js                   零依赖 Node 服务（默认端口 5273）
    ├── start-admin.bat             双击启动后台
    ├── slots.json                  素材槽位定义（112 个文案字段 + 全部图片槽位）
    ├── state.json                  后台当前状态（已改过哪些槽位）
    ├── public/                     后台界面（index.html / app.js / style.css）
    ├── 后台使用说明.md               后台图文操作手册（建议先读这个）
    └── 素材尺寸清单.md               每个槽位的建议尺寸 / 比例 / 视频编码要求
```

> `admin/server.js` 通过 `admin/../portfolio` 定位站点，所以 **`admin/` 与 `portfolio/` 必须保持同级**，不要拆开单独移动。

---

## 二、如何运行网站

三种方式，**都不需要安装依赖**：

| 方式               | 操作                                                                            | 适用                                             |
| ---------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| ① 直接打开（最简单）      | 双击 `portfolio/index.html`                                                     | file:// 协议即可运行，hash 路由与 `overrides.js` 都生效     |
| ② 本地 HTTP 服务（推荐） | `python -m http.server 8000 --directory portfolio`，访问 <http://localhost:8000> | 避免个别浏览器对 file:// 的限制；也可用 `npx serve portfolio` |
| ③ 线上版本           | <https://sweety-zhou.app.workbuddy.host/>                                     | 查看已发布效果                                        |

**依赖说明（重要）**：本项目**没有 package.json、没有依赖锁文件，也不需要 `npm install`** —— 零依赖、无构建。ZIP 中已保留全部运行配置（`assets/overrides.js`、`admin/slots.json`、`admin/state.json`、`admin/start-admin.bat`）。若后续引入构建链，再补 `package.json` 与锁文件即可。

### 页面路由

| 路由               | 页面                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `#/`（默认）         | 首页：Hero、精选作品、关于我、工作经历、合作品牌、设计理念、视觉档案                                                           |
| `#/work`         | 作品网格                                                                                           |
| `#/about`        | 关于                                                                                             |
| `#/contact`      | 联系                                                                                             |
| `#/project/<id>` | 项目详情页，`id` ∈ `clapoclap` `rarebeauty` `qinqiqiu` `kata` `expo` `merch` `atelier` `halo` `dusk` |

---

## 三、如何替换素材

### 方式 A：开后台（推荐，可实时预览）

```bash
cd admin
node server.js          # 或双击 start-admin.bat
# 浏览器打开 http://127.0.0.1:5273/
```

- 左侧清单 → 上传/拖拽图片 → 自动写入 `portfolio/assets/media/` 并重写 `overrides.js`
- 文字改动停止输入约 1 秒自动保存，右侧预览同步刷新
- 覆盖前会把原文件备份到 `admin/_backup/`
- 端口被占用时：`node server.js 5280`

详细操作见 **`admin/后台使用说明.md`**。

### 方式 B：手改配置文件（不开后台）

编辑 `portfolio/assets/overrides.js`，四个配置块：

```js
window.MEDIA_OVERRIDES   = { "cover-kata": "assets/media/cover-kata.png" };  // 图片槽位
window.HERO_BG_OVERRIDE  = { kind:"image", image:"assets/media/hero-image.png" }; // 首页 Hero 底图/视频
window.COPY_OVERRIDES    = { "hero.badge": "你好，我是" };                   // 文案
window.PROJECT_OVERRIDES = { "qinqiqiu.title": "亲气球 · 口腔护理" };         // 项目文案
```

删掉某一行 = 恢复默认。所有改动只影响这一个文件，站点代码不用动。

### 方式 C：原地替换同名文件

有两类素材不走 `overrides.js`，**直接替换同名文件**即可（file:// 打开同样生效）：

- **亲气球案例**：`portfolio/assets/images/qq-*.jpg`（品牌影像、应用图、商详长图等）
- **项目视频**：`portfolio/assets/video/*.mp4`

### 素材格式要求（要点）

- **视频必须是 H.264 / AVC 编码的 `.mp4`**（HEVC / ProRes / QuickTime Animation 在 Chrome 里放不出来）
- 亲气球手机屏内商详长图：宽度 100% 铺满手机屏、**高度不限**，换图后滚动行程按新图高度自动重算
- 完整尺寸表（每个槽位的建议尺寸 / 比例 / 转码命令）见 **`admin/素材尺寸清单.md`**

---

## 四、外部依赖（ZIP 内无法包含，需联网）

| 外部资源                                         | 用途                                    | 离线影响                         |
| -------------------------------------------- | ------------------------------------- | ---------------------------- |
| `fonts.googleapis.com` + `fonts.gstatic.com` | 字体：DM Sans、Noto Sans SC、Noto Serif SC | 离线时回退到系统字体；布局可用，但字形/字重会与线上不同 |
| `https://sweety-zhou.app.workbuddy.host/`    | 已发布的线上站点（WorkBuddy 托管）                | 与本地文件无关，仅作对照                 |

站点素材的**原始来源在项目目录之外**（如 `H:\产品合集`、微信临时目录），未随 ZIP 打包；但站点实际使用的副本已全部收录在 `portfolio/assets/` 中，**不影响运行**。

---

## 五、本次打包范围（含 / 不含）

**已包含**：`portfolio/` 全量（含**全部** 291 个素材文件，201.7 MB）、`admin/` 后台与两份文档、本 README 与 `PROJECT_STATUS.md`。

**已排除**（均为可再生成的历史快照 / 开发调试产物，**原始项目里仍完整保留、未做任何删除或修改**）：

| 排除项                            | 数量 / 体积       | 说明                                                                |
| ------------------------------ | ------------- | ----------------------------------------------------------------- |
| `portfolio/index.html.bak-*`   | 15 个 / ≈9 MB  | 历次改动前的 HTML 备份                                                    |
| `portfolio/index-pre-*.html`   | 26 个 / ≈19 MB | 各次改版前快照（R7…R24 等）                                                 |
| `portfolio/.workbuddy/backup/` | 13 个 / 6.9 MB | 开发期备份                                                             |
| `admin/_backup/`               | 15 个          | 后台替换素材时的原图备份                                                      |
| 会话根目录排查产物                      | —             | `fin1440.png`、`_h390-hero.png`、`_rb*-kv.png` 等截图与 JSON（验收用，非项目文件） |

如需连历史快照一起迁移，把上述文件自行拷入对应目录即可，结构不受影响。

---

## 六、资源引用完整性自检（打包前实测）

- `index.html` / `assets/overrides.js` / `font-system.html` 中引用的 **70 条素材路径** + **851 个文件名** → 对应文件**全部存在，零缺失**（含卡塔页 `K + 文件名` 动态拼接的引用）
- `assets/` 下 291 个文件**全部打包**；其中 52 个当前页面未直接引用（素材库备用图、已下线视频、替换前原图备份），按「保留原始素材」要求一并收录
- 未发现死链、未发现指向项目外的本地路径

---

## 七、开发提示（踩过的坑）

1. **同一文件多处编辑必须串行**：并行编辑 `index.html` 会发生写覆盖，只有最后一笔生效。
2. **验收用视口截图**：无头 Chrome 整页截图（`captureBeyondViewport`）对 `loading="lazy"` 的图片会渲染成空白格，看起来像「图挂了」，实际正常 —— 用 `scrollIntoView` + 视口截图复核。
3. **改结构前先备份** `index.html`（例如 `index.html.bak-YYYYMMDD`）。
4. **卡塔页图片路径是动态拼接**（`const K='assets/images/kata/'` + 文件名），搜索资源引用时别忘了这一层。
5. 站点是**单一暗色主题**（2026-10-10 起统一为高级黑色系），已移除 `data-theme` 主题切换逻辑，不要再按「双主题」思路改样式。
