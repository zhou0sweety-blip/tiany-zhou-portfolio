#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
push_via_api.py — 通过 GitHub REST API（api.github.com）把本地仓库完整推送到远程。

背景：本机网络无法使用 git 的 HTTPS 通道访问 github.com（CONNECT 502 / 直连无路由），
      但 api.github.com 可达。因此改用 Git Data API 逐层构建对象后更新 ref。

特性：
  * 保留全部提交历史 —— 按提交顺序逐个创建 blob / tree(base_tree 增量) / commit
  * 支持二进制文件（blob 以 base64 上传，图片/视频原样入库）
  * 默认 dry-run，只打印计划；加 --push 才真正写入

用法：
  export GH_TOKEN=github_pat_xxx        # 需要 Contents: Read and write
  python push_via_api.py --dry-run
  python push_via_api.py --push

作者备注：PAT 用完请到 GitHub 设置里吊销。
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

OWNER = "zhou0sweety-blip"
REPO = "tiany-zhou-portfolio"
BRANCH = "main"
API = "https://api.github.com"
TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""


# ---------------------------------------------------------------- git helpers
def git(*args, binary=False):
    out = subprocess.run(["git", *args], capture_output=True, check=True).stdout
    return out if binary else out.decode("utf-8", "replace")


def commit_list():
    """从最旧到最新，列出全部提交（sha / message / parents）。"""
    raw = git("log", "--reverse", "--pretty=format:%H%x1f%P%x1f%s%x1e")
    items = []
    for rec in raw.split("\x1e"):
        rec = rec.strip("\n")
        if not rec:
            continue
        sha, parents, subject = rec.split("\x1f", 2)
        items.append({
            "sha": sha,
            "parents": parents.split() if parents else [],
            "message": subject,
        })
    return items


def changed_files(sha):
    """该提交相对父提交变化的文件路径（新增/修改/删除）。"""
    if not git("rev-list", "--parents", "-n", "1", sha).strip().split()[1:]:
        # 根提交：全部文件
        return [(p, "add") for p in git("ls-tree", "-r", "--name-only", sha).splitlines() if p]
    out = git("diff-tree", "--no-commit-id", "--name-status", "-r", "-M", sha)
    res = []
    for line in out.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status, path = parts[0], parts[-1]
        if status.startswith("R") or status.startswith("C"):
            res.append((parts[1], "del"))
            res.append((parts[2], "add"))
        elif status.startswith("D"):
            res.append((path, "del"))
        else:
            res.append((path, "add"))
    return res


def read_blob(sha, path):
    return subprocess.run(["git", "show", f"{sha}:{path}"], capture_output=True, check=True).stdout


# ------------------------------------------------------------------ api calls
def api(method, path, payload=None, retries=4):
    url = path if path.startswith("http") else API + path
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if data:
        req.add_header("Content-Type", "application/json")
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read().decode() or "{}")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:400]
            if e.code in (429, 500, 502, 503) and attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
                continue
            raise SystemExit(f"API {method} {path} 失败: HTTP {e.code}\n{body}")
        except urllib.error.URLError as e:
            if attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
                continue
            raise SystemExit(f"API {method} {path} 网络错误: {e}")
    raise SystemExit("unreachable")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true", help="真正写入（默认仅打印计划）")
    ap.add_argument("--branch", default=BRANCH)
    args = ap.parse_args()

    commits = commit_list()
    total_files = len([p for p in git("ls-files").splitlines() if p])
    total_bytes = sum(
        os.path.getsize(p) for p in git("ls-files").splitlines() if p and os.path.exists(p)
    )
    print(f"本地：{len(commits)} 个提交 / {total_files} 个文件 / {total_bytes/1048576:.1f} MB")
    print(f"目标：{OWNER}/{REPO}@{args.branch}")
    if not args.push:
        print("\n[dry-run] 将按以下顺序构建对象：")
        for c in commits:
            ch = changed_files(c["sha"])
            print(f"  {c['sha'][:8]}  {len(ch):4d} 个文件变更  {c['message'][:52]}")
        print("\n确认无误后执行：python push_via_api.py --push")
        return

    if not TOKEN:
        raise SystemExit("缺少 GH_TOKEN 环境变量")

    # 远程当前状态
    try:
        ref = api("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{args.branch}")
        remote_sha = ref["object"]["sha"]
        print(f"远程 {args.branch} 当前指向: {remote_sha[:8]}")
    except SystemExit:
        remote_sha = None
        print("远程尚无分支，将创建")

    # 逐提交构建 blob / tree / commit
    base_tree = None  # 远程已有 tree（若远程无我们历史，用 None 起步）
    parent = None
    t0 = time.time()
    for idx, c in enumerate(commits, 1):
        changes = changed_files(c["sha"])
        entries = []
        for path, kind in changes:
            if kind == "del":
                entries.append({"path": path, "mode": "100644", "type": "blob", "sha": None})
                continue
            content = read_blob(c["sha"], path)
            blob = api("POST", f"/repos/{OWNER}/{REPO}/git/blobs", {
                "content": base64.b64encode(content).decode(),
                "encoding": "base64",
            })
            mode = "100755" if subprocess.run(
                ["git", "ls-tree", c["sha"], path], capture_output=True
            ).stdout.decode().startswith("100755") else "100644"
            entries.append({"path": path, "mode": mode, "type": "blob", "sha": blob["sha"]})
        tree_payload = {"tree": entries}
        if base_tree:
            tree_payload["base_tree"] = base_tree
        tree = api("POST", f"/repos/{OWNER}/{REPO}/git/trees", tree_payload)
        base_tree = tree["sha"]
        commit_payload = {"message": c["message"], "tree": tree["sha"]}
        if parent:
            commit_payload["parents"] = [parent]
        new_commit = api("POST", f"/repos/{OWNER}/{REPO}/git/commits", commit_payload)
        parent = new_commit["sha"]
        print(f"  [{idx}/{len(commits)}] {c['sha'][:8]} -> {parent[:8]}  {len(entries)} 个文件  "
              f"({time.time()-t0:.0f}s)")

    # 更新（或创建）分支 ref
    try:
        api("PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{args.branch}", {
            "sha": parent, "force": True,
        })
    except SystemExit:
        api("POST", f"/repos/{OWNER}/{REPO}/git/refs", {
            "ref": f"refs/heads/{args.branch}", "sha": parent,
        })
    print(f"\n完成：{args.branch} -> {parent}")
    print(f"耗时 {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
