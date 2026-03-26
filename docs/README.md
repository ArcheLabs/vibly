# Vibly Frontend Preview Docs

本目录包含用于生成 **Vibly PC 端前端预览版** 的文档集合，适合直接提供给 Codex 或前端开发作为静态预览实现依据。

## 文件说明

- `00-product-scope.md`：定义本轮前端预览的范围与边界
- `01-information-architecture.md`：定义页面层级、导航与跳转关系
- `02-page-spec-chat-first.md`：定义页面规格，重点细化聊天页
- `03-component-spec.md`：定义推荐抽象的组件清单
- `04-interaction-and-demo-states.md`：定义预览版必须具备的交互与演示状态
- `05-mock-data.md`：定义本地 mock 数据结构与建议样例

## 推荐使用顺序

1. 先阅读 `00-product-scope.md`
2. 再阅读 `01-information-architecture.md`
3. 然后按 `02-page-spec-chat-first.md` 实现页面
4. 用 `03-component-spec.md` 抽组件
5. 用 `04-interaction-and-demo-states.md` 实现本地交互
6. 用 `05-mock-data.md` 生成演示数据

## 给 Codex 的建议任务说明

```text
请根据 docs/frontend-preview/ 下的文档生成一个 Vibly PC 端前端预览版。

要求：
1. 只实现前端静态预览，不接入 API、后端或链上能力。
2. 使用本地 mock data 和局部 UI state。
3. 优先完成聊天页，再完成智能体、发现、联系人、钱包、我的。
4. 必须支持用户信息页和智能体信息页的打开与关闭。
5. 必须支持从发现页发起聊天并进入聊天页的演示路径。
6. 保持结构清晰、组件复用、便于后续替换为正式实现。
```
