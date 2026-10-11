# 推送指南 · tiany-zhou-portfolio

> 目标仓库：<https://github.com/zhou0sweety-blip/tiany-zhou-portfolio>
> 状态：**已完成推送** —— 本机网络无法走 git 的 HTTPS 通道，最终改用 REST API 直推（见 01），保留 11 个提交历史。

---

## 00 · 本机网络实测结论

| 通道 | 结果 |
| --- | --- |
| `github.com:443`（git HTTPS，走系统/沙盒代理） | ❌ `CONNECT tunnel failed, response 502` |
| `github.com:443`（直连，禁用代理） | ❌ `Failed to connect`（本机网络无路由） |
| `ssh.github.com:443`（SSH over HTTPS 端口） | ✅ 可连通（需自备密钥，见 02） |
| **`api.github.com`（REST API，走代理）** | ✅ **可访问 —— 本次推送即走此通道** |

结论：本机 **不能** 用 `git push` 直接推送，但 REST API 通道畅通。

---

## 01 · 本次实际采用：REST API 直推

脚本：`scripts_audit/push_via_api.py`。用 Git Data API 逐提交创建 blob / tree（`base_tree` 增量）/ commit，
再更新分支 ref —— 完整保留提交历史，二进制文件以 base64 上传，不受「只能传文本」的限制。

```bash
export GH_TOKEN=github_pat_xxx                  # 需 Contents: Read and write
python scripts_audit/push_via_api.py            # 空跑：打印每个提交的文件变更计划
python scripts_audit/push_via_api.py --push     # 真正推送
```

实测要点：

- 首次上传 173MB 约 11 分钟；脚本会复用 GitHub 端已存在的 blob，中断后重跑只补传增量
- 令牌**不需要** `Workflows` 权限（仓库内现无 `.github/workflows/` 文件）
- 路径含中文时需要 `core.quotepath=false`，脚本已内置
- 首次推送会以 `force` 覆盖仓库里那条自动生成的 22 字节 README（本次已覆盖）

---

## 02 · 路径 B：用 SSH over 443 推送（本机通道可达，无需共享密码）

本机 `ssh.github.com:443` 可连通，因此用 SSH 方式推送最稳。

1. 生成密钥（如已有可跳过）：
   ```bash
   ssh-keygen -t ed25519 -C "zhou.0sweety@gmail.com"
   ```
2. 复制公钥到 GitHub：<https://github.com/settings/keys> → New SSH key，粘贴 `~/.ssh/id_ed25519.pub` 内容。
3. 配置走 443 端口（本机 22 端口不通时必需）——在 `~/.ssh/config` 写入：
   ```
   Host github.com
     HostName ssh.github.com
     Port 443
     User git
   ```
4. 验证与推送：
   ```bash
   ssh -T git@github.com          # 应显示 Hi zhou0sweety-blip!
   cd F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project
   git remote set-url origin git@github.com:zhou0sweety-blip/tiany-zhou-portfolio.git
   git push -u origin main --force
   ```

---

## 03 · 路径 C：在能访问 github.com 的网络环境手动推送

在任一可正常访问 GitHub 的电脑上（同一项目目录，或使用下面的打包文件）执行：

```bash
cd F:/Sweety_Zhou_Portfolio_Full_Project/Sweety_Zhou_Portfolio_Full_Project
git remote add origin https://github.com/zhou0sweety-blip/tiany-zhou-portfolio.git   # 若已存在跳过
git push -u origin main --force
```

> 首次推送会要求登录：用户名填 GitHub 用户名，密码填 **Personal Access Token**
> （<https://github.com/settings/tokens> → Tokens (classic) → 勾 `repo`）。

---

## 04 · 已备好的打包产物（`packages/`，不入版本库）

| 文件 | 说明 |
| --- | --- |
| `tiany-zhou-portfolio_source_20261011.zip`（163.8 MB） | 325 个文件的完整网页资料：`portfolio/`（入口页 + 304 个图片/视频/SVG 资源 + `vercel.json`）、`admin/`、`docs/`、`scripts_audit/`、根级文档与 `.gitignore` |
| `tiany-zhou-portfolio_history_20261011.bundle`（171.6 MB） | 含全部 6 个提交历史的 Git bundle，校验结果 *complete history* |

bundle 恢复方式（在任意机器上还原出完整仓库后直接推送）：

```bash
git clone tiany-zhou-portfolio_history_20261011.bundle tiany-zhou-portfolio
cd tiany-zhou-portfolio
git remote set-url origin https://github.com/zhou0sweety-blip/tiany-zhou-portfolio.git
git push -u origin main --force
```

---

## 05 · 推送后建议：Vercel 导入

Vercel → Add New → Project → 选择该仓库 →

| 字段 | 值 |
| --- | --- |
| Framework Preset | `Other` |
| **Root Directory** | **`portfolio`**（必须） |
| Build / Output / Install Command | 全部留空 |
