# 推送指南 · tiany-zhou-portfolio

> 目标仓库：<https://github.com/zhou0sweety-blip/tiany-zhou-portfolio>
> 本地状态：`main` 分支 6 个提交 / 325 个受控文件 / 173MB，远程 `origin` 已配置完毕。

---

## 00 · 当前阻塞原因（实测结论）

| 通道 | 结果 |
| --- | --- |
| `github.com:443`（git HTTPS，走系统/沙盒代理） | ❌ `CONNECT tunnel failed, response 502` |
| `github.com:443`（直连，禁用代理） | ❌ `Failed to connect to github.com:443`（本机网络无路由） |
| `ssh.github.com:443`（SSH over HTTPS 端口） | ✅ **可连通**（仅缺密钥，返回 `Permission denied (publickey)`） |
| `api.github.com`（REST API，走代理） | ✅ 可访问（HTTP 200，已用其确认仓库存在） |

结论：**本机无法直接走 HTTPS 推送**，但有两条可用路径（见下）。

---

## 01 · 路径 A（推荐）：授权 GitHub 连接器，由我完成推送

1. 在对话中安装并授权 **GitHub** 连接器（连接器菜单 → GitHub → 授权）。
2. 授权后告诉我一声，我会直接：
   - 推送 `main` 到 `origin`
   - 因远程仅有自动生成的 22 字节 README（1 个提交、历史无关），将使用 `git push -u origin main --force` 覆盖，
     你仓库根目录的正式 `README.md`（9.1KB）会替换掉那个占位文件
3. 推送完成后我会在线上核对文件数与提交记录。

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
