# Color Walk（纯前端 H5 / PWA）

移动端优先的「同色挑战」小游戏：每天最多 3 个随机挑战，拍同色物体填满九宫格并导出分享。

## 功能要点（业务规则）

- 每天最多 3 个挑战
- 新挑战颜色随机
- 超过 3 个时覆盖当天最早挑战（有确认提示）
- 挑战可切换继续，且互不串图（上传写入绑定开始时的 challengeId）
- 上传图片需做同色系判定（基于目标色，取中心区域平均色）
- 导出九宫格：支持系统分享；并保留“长按保存到相册”的预览路径

## 目录结构

- `index.html`：页面结构（移动端优先）
- `styles.css`：视觉风格（摄影感、简洁年轻）
- `app.js`：核心逻辑（挑战管理/上传判定/导出），含关键注释
- `manifest.json`：PWA 配置
- `sw.js`：Service Worker（避免新旧脚本混用）

## 本地调试

> Service Worker 仅在 `https` 或 `http://localhost` 生效。

在项目目录运行：

```bash
python3 -m http.server 5173
```

然后打开：

- `http://localhost:5173/`

调试建议：

- iPhone Safari：用真机打开 `localhost`（或通过同网段局域网地址）
- 微信内置浏览器：重点验证「系统分享」与「长按保存」

## 发布到 Cloudflare Pages

这是纯静态站点，直接把仓库部署到 Cloudflare Pages 即可：

- Build command：留空
- Output directory：`/`（仓库根目录）

发布后如需强制让用户拿到新版本：

- 修改 `sw.js` 里的 `CACHE`（例如从 `color-walk-v11` 改为 `color-walk-v12`）

## 回滚说明

仓库提供了简单的“打标签存档/回滚”脚本：

- 列出可回滚存档：`./list-backups.sh`
- 发布并创建存档标签：`./release.sh "chore: release"`
- 回滚到某个存档：`./rollback.sh backup-YYYY-MM-DD-HHMMSS`

## 数据兼容与迁移

旧版使用 `localStorage` 键 `cw:day:v3:YYYY-MM-DD`。

新版使用 `cw:day:v4:YYYY-MM-DD`，首次打开会自动迁移当日数据：

- v3 的 `items[{data,at}]` → v4 的 `items[{dataUrl,createdAt}]`
- 迁移后写入 v4；v3 不删除（方便回滚）

## 验收清单（建议）

- iPhone 连续上传 3 张不误报（不出现“提示失败但实际成功上传”）
- 每日第 4 个挑战触发覆盖最早逻辑正确
- 挑战切换后数据隔离正确（不串图）
- 导出路径可用（系统分享 + 预览长按保存）

