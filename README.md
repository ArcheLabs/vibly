# Vibly Preview

单仓库前端预览工程，使用同一套 React UI 同时支持：

- Web 预览
- Tauri 2 PC 客户端外壳

## 技术栈

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Tauri 2

## 目录

```text
src/
  components/
  mock/
  pages/
  router/
src-tauri/
docs/
```

## 启动 Web 预览

```bash
npm install
npm run dev
```

默认端口：`1420`

## 构建 Web

```bash
npm run build
```

## Tauri

当前已准备好 `src-tauri/` 基础结构与配置。

```bash
npm run tauri:dev
npm run tauri:build
```

说明：

- 当前验收重点是 Web 预览。
- 在 WSL 中优先跑 Web。
- 后续可在 Windows 主机侧直接执行 Tauri 调试或构建命令。
