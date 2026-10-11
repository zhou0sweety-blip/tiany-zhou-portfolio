# 上线部署指南 · GitHub → Vercel → Cloudflare → zhoutiantiandesign.com

> 站点形态：**纯静态单文件 SPA**（`portfolio/index.html` + `portfolio/assets/`），无构建步骤、零依赖。  
> 本地仓库已初始化并完成首次提交，`portfolio/vercel.json` 已配置缓存与安全响应头。

---

## 00 · 前置状态

| 项目            | 状态                                                                 |
| ------------- | ------------------------------------------------------------------ |
| 站点入口          | `portfolio/index.html`（hash 路由：`#/home`、`#/work`、`#/project/<id>`） |
| 构建步骤          | 无（Vercel 直接托管静态文件）                                                 |
| 本地 Git        | 已 `git init` + 首次提交（分支 `main`）                                     |
| `vercel.json` | 已就位：assets 一年强缓存 / index.html 不缓存 / 安全头                            |
| 待你操作          | GitHub 建仓推送、Vercel 导入、Cloudflare 解析（需你的账号授权）                       |

---

## 01 · 推到 GitHub

1. 打开 <https://github.com/new> ，创建**空仓库**（不要勾选 README / .gitignore / license）：
   - 仓库名建议：`tiany-zhou-portfolio`
   - 可见性：`Private`（推荐，站内素材不外泄）或 `Public`
2. 在项目根目录执行（把 `<你的用户名>` 换成实际值）：

```bash
cd F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project
git remote add origin https://github.com/<你的用户名>/tiany-zhou-portfolio.git
git push -u origin main
```

> 首次推送会要求登录：用 GitHub 网页版生成的 **Personal Access Token** 当密码（Settings → Developer settings → Tokens (classic) → 勾 `repo`）。  
> 之后每次改动只要 `git add -A && git commit -m "..." && git push`。

---

## 02 · Vercel 部署

1. <https://vercel.com> → **Add New → Project → Import Git Repository** → 授权并选择刚推的仓库。
2. **关键设置**（一处填错会导致 404）：

| 字段                 | 值                                       |
| ------------------ | --------------------------------------- |
| Framework Preset   | `Other`                                 |
| **Root Directory** | **`portfolio`** ← 必须，站点入口与 assets 都在此目录 |
| Build Command      | 留空                                      |
| Output Directory   | 留空（默认即根）                                |
| Install Command    | 留空                                      |

1. 点 **Deploy**，约 30 秒后拿到 `https://<项目名>.vercel.app` 临时域名 —— 先在这个域名上验收整站。
2. 之后每次 `git push`，Vercel 自动重新部署。

---

## 03 · Cloudflare DNS 解析

进入 Cloudflare → 选择 `zhoutiantiandesign.com` → **DNS → Records**，添加两条记录：

| 类型      | 名称    | 内容 / 目标                | 代理状态             |
| ------- | ----- | ---------------------- | ---------------- |
| `A`     | `@`   | `76.76.21.21`          | **DNS only（灰云）** |
| `CNAME` | `www` | `cname.vercel-dns.com` | **DNS only（灰云）** |

⚠️ **必须点掉橙云**（代理关闭）：

- 橙云会让 Cloudflare 自己终结 SSL，Vercel 无法完成 Let's Encrypt 域名校验 → 面板报 `Invalid Configuration`、SSL 一直 pending，或出现 Cloudflare 525 错误。
- 正确顺序：**先灰云 → 等 Vercel 签发证书（约 5–15 分钟）→ 站点 https 正常后**，再决定是否开橙云（若要开，SSL/TLS 模式必须设为 **Full (strict)**）。

其他注意点：

- **以 Vercel 面板显示的记录值为准**（部分账号会显示 `cname.vercel-dns-0.com`）。
- 先删掉可能存在的旧记录：GoDaddy/Squarespace 之类留下的 parking A 记录、`www` 上已有的 A 记录（同一主机名 A 与 CNAME 冲突会间歇性失败）。
- 根域只能用 **A 记录**，CNAME 不能用在 `@`。
- 若域名有 CAA 记录，需允许 `0 issue "letsencrypt.org"`，否则证书签发被拒。
- 解析生效通常 1–15 分钟，最长 48 小时（受 TTL 与缓存影响）。

---

## 04 · 在 Vercel 绑定域名

Vercel → 你的项目 → **Settings → Domains**：

1. 添加 `zhoutiantiandesign.com`
2. 添加 `www.zhoutiantiandesign.com`（两项都加，跳转才能生效）
3. 选一个主域（建议以 **apex 不带 www** 为主），把另一个设为 **308 永久跳转** 指向主域
4. 回到 Domains 页等状态变为 **Valid Configuration**，SSL 自动签发

---

## 05 · 上线验收清单

```bash
dig +short zhoutiantiandesign.com      # 应返回 76.76.21.21
dig +short www.zhoutiantiandesign.com  # 应返回 cname.vercel-dns.com 的解析结果
```

- [ ] `https://zhoutiantiandesign.com` 打开正常、地址栏显示绿锁
- [ ] `https://www.zhoutiantiandesign.com` 自动 308 跳转到主域
- [ ] 首页 → 导航到 `#/work` → 点进项目页（如「品牌周边礼品」）全部正常
- [ ] 图片/视频全部加载（打开控制台确认无 404）
- [ ] 手机端浏览器访问正常（Safari / Chrome 各试一次）
- [ ] 分享到微信能正常打开

---

## 06 · 建议与后续

- **素材体积**：当前 `assets/` 约 213MB（其中 `images/kata` 152MB，最大单图 16.9MB）。首屏不受影响（懒加载），但建议后续把 >5MB 的源图重编码到 1–2MB（分辨率不变、导出质量 82–85），可显著缩短详情的加载时间。
- **未入库的备份**：5 个未被站点引用的原始素材备份目录已写入 `.gitignore`（本地磁盘保留，不进仓库、不进部署包）。
- **单文件体量**：`index.html` 约 5000+ 行 / 700KB，后续若要长期迭代，建议按视图拆成 `views/*.js`。
- **WorkBuddy 发布链接**：与域名部署相互独立、可并存。若决定只保留自有域名，可在「设置—数据管理—应用」中把之前的发布下线。

---

## 07 · 关于 `package.json`（常见疑问）

### 为什么仓库里原本没有这个文件？

**因为这个站点本来就没有。** 排查结论（三条独立证据）：

| 排查项 | 结果 |
| --- | --- |
| 文件系统全盘搜索 `package.json` | 0 个（项目内、`portfolio/` 内、`admin/` 内均无） |
| `git ls-files` / `git log --all -- package.json` | 未被追踪、历史提交里从未出现过 |
| `.gitignore` | 无任何与 `package.json` 相关的忽略规则（只忽略了 `packages/`、`admin/state.json` 等） |

这不是「漏传」，而是**它从未存在过**：本项目是**零构建纯静态站点**——`portfolio/index.html` 单文件 + 原生 JS，没有 React / Vite / Next，没有 npm 依赖，所以没有生成过 `package.json`。

### 那为什么部署时「需要」它？

因为多数部署面板（Vercel / Netlify / Cloudflare Pages）会**优先看仓库根目录有没有 `package.json`**来判断项目类型。你看到的「没有这个文件我没法部署」，通常来自两种情况：

1. 你在**仓库根目录**导入项目，面板找不到 `package.json`，又没有手动指定根目录 → 报错或识别成空项目；
2. 你在**用命令行 / 本地起服务**做预览，需要一个 `start` 脚本来一键启动。

### 已补上，且位置经过刻意选择

已新增两个文件到**仓库根目录**：

```
package.json              ← 4 个脚本：start / dev / site / admin
tools/static-server.mjs   ← 零依赖 Node 静态服务器（服务 portfolio/）
```

`package.json` 内容要点：

```json
{
  "name": "tiany-zhou-portfolio",
  "private": true,
  "engines": { "node": ">=18" },
  "scripts": {
    "start": "node tools/static-server.mjs",
    "dev":   "node tools/static-server.mjs",
    "site":  "node tools/static-server.mjs",
    "admin": "node admin/server.js 5273"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- `npm start` / `npm run dev` / `npm run site` → 本地起静态服务，默认 <http://localhost:8080>（`PORT` 环境变量可改），站点根自动探测（仓库布局取 `portfolio/`，也可用 `STATIC_ROOT` 显式指定）。
- `npm run admin` → 启动本地素材替换后台（<http://localhost:5273>）。
- `dependencies` / `devDependencies` **均为空**——刻意保持零依赖，`npm install` 不做任何事，不需要联网装包。

### ⚠️ 关键：`package.json` 必须留在仓库根目录，**不要**放进 `portfolio/`

| 放置位置 | 后果 |
| --- | --- |
| 仓库根目录（当前做法）| ✅ Vercel 的 **Root Directory = `portfolio`**，根目录的 `package.json` 在部署根之外，会被忽略，静态托管照常工作 |
| 放进 `portfolio/` | ❌ Vercel 会把它识别为 **Node 项目**，进而要求 Build Command、尝试 `npm install`、去找 `.next`/`dist` 产物 → 部署直接失败或返回 404 |

所以 Vercel 上的设置维持不变：

| 字段 | 值 |
| --- | --- |
| Framework Preset | `Other` |
| **Root Directory** | **`portfolio`** |
| Build Command | 留空 |
| Output Directory | 留空 |
| Install Command | 留空 |

### 本地如何自测（不依赖任何云平台）

```bash
cd F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project
npm start                 # → http://localhost:8080
# 或指定端口：
PORT=8080 npm start
```

已实测：`/`、`/index.html`、`/assets/media/og-cover.jpg`、`/assets/logo-studio.svg`、`/assets/overrides.js` 全部 `200`，未知路径返回 `404`，`/#/work` 等 hash 路由正常。
