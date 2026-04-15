# Vibly Codex 任务拆解（执行顺序）

状态：开发排期文档  
依赖：
- `vibly-mvp-architecture-freeze.md`
- `vibly-codex-implementation-spec.md`

---

## 1. 总体目标

按最小可演示闭环完成：
- 钱包接入 / 导入
- 注册 Identity
- 发布 public profile
- 创建 private agent
- 发布 public agent
- Gateway 聚合公开视图
- Web 端公开可发现

---

## 2. 工作包

## WP1：基础设施与配置

### 目标
建立前端与服务端基础骨架。

### 任务
- 配置环境变量：chain endpoint / gateway endpoint
- 建立模块目录骨架
- 建立通用 API client
- 建立 content schema types
- 建立 notification store

### DoD
- 项目能编译运行
- 有统一配置入口
- 有基础 layout 与 error boundary

---

## WP2：Wallet Onboarding

### 任务
- 实现 Web 钱包检测与连接
- 实现桌面端 import seed / JSON / QR signer UI
- 实现 create test wallet UI
- 实现 account picker
- 实现 network mismatch UI

### DoD
- Web 可连接支持的钱包
- 桌面端可导入账户/创建测试钱包
- 可切换 active account

---

## WP3：Identity Registration

### 任务
- identity query hook
- register identity form
- profile draft schema
- upload profile to gateway
- upload empty agent registry
- submit register tx
- register success page / notification

### DoD
- 完整注册链路可跑通
- `me` 页面显示 identity summary

---

## WP4：Profile Publish

### 任务
- profile editor
- avatar upload
- publish profile action
- show active profile ref
- public profile preview

### DoD
- 可发布 profile
- gateway 可读取 profile
- public profile page 可展示

---

## WP5：Private Agent CRUD

### 任务
- local agent schema
- create/edit/delete agent
- private/public visibility toggle
- publish state overlay icon
- agents list filters

### DoD
- private_local / public_draft 状态完整可见
- 本地 CRUD 可持久化

---

## WP6：Publish Public Agent

### 任务
- build agent registry draft
- upload registry
- optional auth registry upload
- submit `SetActiveAgentRegistry`
- publish / republish flow
- dirty state detection

### DoD
- public_live / public_dirty / publishing 状态完整跑通
- gateway 可读取公开 agent list

---

## WP7：Dev Gateway

### 任务
- content storage
- `ContentRef` generation
- basic content read API
- chain event indexer
- identity aggregation API
- public agents API
- search API

### DoD
- 能通过 identity id 查询聚合视图
- 能通过 search 找到公开 identity / agent

---

## WP8：Discovery + Public Pages

### 任务
- discovery list page
- public identity page
- public agent list section
- empty states

### DoD
- 访客可看到 public profile 与 public agent

---

## WP9：Local Relations

### 任务
- relation local store
- relation actions: contact/favorite/block
- relation policy resolver
- minimal UI entry in profile/chat context

### DoD
- 关系以 identity id 为键存储
- 可本地修改并读取

---

## WP10：Polish

### 任务
- global banners
- notification center
- retry flows
- diagnostics panel
- loading states / empty states

### DoD
- 所有关键流程有成功/失败/待处理可见反馈

---

## 3. 建议实施顺序

1. WP1
2. WP2
3. WP3
4. WP4
5. WP5
6. WP6
7. WP7
8. WP8
9. WP9
10. WP10

---

## 4. 演示脚本（最终验收）

### Demo 1：注册真人身份
- 打开客户端
- 连接/导入/创建测试钱包
- 完成 identity 注册
- 查看 `me` 页面 identity 信息

### Demo 2：发布公开资料
- 编辑 profile
- 发布到链上
- 在 public profile 页面打开

### Demo 3：创建私有 agent
- 新建 agent
- 列表显示私有锁图标

### Demo 4：发布公开 agent
- 将 agent 改为 public
- 发布
- 列表显示地球图标
- public profile 页面出现该 agent

### Demo 5：修改公开 agent
- 修改 agent 内容
- 列表显示 dirty 状态
- 点击 republish
- 状态恢复 public_live

### Demo 6：关系本地化
- 将某 identity 标记为 contact / favorite / blocked
- 刷新后本地关系仍保留

