# Vibly MVP 架构冻结文档

状态：冻结草案（MVP Architecture Freeze）  
适用范围：本地测试链演示 + MVP 实现  
关联协议：ICP / PIP / PIP Action Registry  
关联仓库：`vibly-chain`、`vibly`

---

## 1. 文档目标

本文用于冻结 Vibly MVP 的系统边界，明确：

1. 哪些对象属于链上最小真相；
2. 哪些对象属于链下公开对象；
3. 哪些对象只存在于本地；
4. MVP 是否需要服务器，以及服务器承担什么职责；
5. 钱包、身份、智能体、关系、公开资料之间的边界；
6. 前端、链、服务端在本地测试链演示中的责任分工。

本文冻结后，除非协议本身发生根本变化，否则前端、服务端与链侧实现均按本文为准。

---

## 2. 核心原则

### 2.1 链上最小化

链上只保存：
- 规范主体（Root Identity）
- 控制权（owner / recovery / authorized keys）
- 活跃公开指针（active pointers）
- 最小状态机与事件

链上**不保存**：
- 完整用户资料正文
- 完整 agent 资料正文
- 关系图
- 私有 prompt
- 私有记忆
- 本地知识文件夹
- 完整会话数据

### 2.2 公开与私有分层

Vibly 中同一用户下的 agent 可以同时存在：
- **公开 agent**：对外可发现，可被链上活跃指针引用
- **私有 agent**：仅在本地存在，不进入公开注册表

### 2.3 主体唯一

MVP 中的 canonical actor 只有根身份（Root Identity / IdentityId）。

默认情况下：
- agent 不是新的链上主体；
- agent 不是新的 payer / payee；
- transport account 不是新的主体；
- 钱包地址不是最终产品主体。

### 2.4 公开对象链下承载

公开资料、公开 agent 注册表、公开定价策略等对象使用链下公开文档承载，由链上保存其 `ContentRef` 指针。

### 2.5 MVP 关系本地化

用户关系在 MVP 中只保存在本地，统一以 `IdentityId` / `ActorId` 作为键。

未来如果需要同步或托管，只扩展 relation API，不改变本地数据模型。

---

## 3. 系统分层

### 3.1 链上层（On-chain Truth Layer）

负责：
- Identity 注册与管理
- active pointers 更新
- 权限边界锚定
- 事件输出
- PaymentIntent 等协议对象（若本轮演示包含支付）

不负责：
- profile 正文存储
- agent 正文存储
- 搜索与公开发现聚合
- 关系图保存
- 私有数据保存

### 3.2 链下公开对象层（Public Off-chain Objects）

负责承载公开元数据：
- public profile
- public agent registry
- pricing policy
- auth registry
- relation policy（仅策略，不是关系图）

要求：
- 可通过 `ContentRef` 引用
- 可被服务端读取与聚合
- 可由前端重新发布新版本

### 3.3 本地私有层（Local Private State）

负责：
- private agent
- local relation graph
- 私有记忆
- prompt / secret / tool config
- 草稿
- 本地测试钱包
- 本地 UI 偏好

### 3.4 网关 / 索引服务层（Gateway / Indexer Layer）

负责：
- 接收公开对象并返回 `ContentRef`
- 监听链上事件
- 聚合 Identity 公开视图
- 提供公开发现与查询 API
- 向 Web / 桌面端提供统一读取接口

---

## 4. MVP 组件边界

### 4.1 `vibly-chain`

职责：
- 本地测试链
- Identity 相关 pallet / runtime API
- active pointer 更新
- 基础事件输出
- 可选：PIP / PaymentIntent 最小实现

### 4.2 `vibly`（客户端）

职责：
- Web 前端
- Tauri 桌面端
- 钱包接入 / 导入 / 测试钱包
- Identity 注册流程
- public profile 编辑与发布
- private/public agent 创建与管理
- relation 本地存储
- 全局通知系统
- 调用 gateway / content service

### 4.3 `vibly-dev-gateway`（最小服务端）

职责：
- content storage
- content hash / cid 生成
- chain indexer
- discovery API
- identity public view API
- public agent view API

MVP 中推荐将 content service 与 gateway 实现为一个进程。

---

## 5. 主体模型冻结

### 5.1 Wallet Account

钱包账户用于：
- 签名
- 控制 owner key
- 支付 gas / 手续费

钱包账户不是最终产品里的 canonical actor。

### 5.2 Root Identity

Root Identity 是：
- canonical actor
- 对外身份主体
- 默认 payer / payee 所属主体
- agent 的默认拥有者与收益归属者

### 5.3 Agent

默认情况下，agent 是：
- 执行上下文
- capability / service entry
- public/private 可见对象

默认情况下，agent **不是**：
- 独立链上主体
- 独立 payer / payee
- 独立 treasury

### 5.4 何时允许独立 service identity

仅当某个 agent 需要：
- 独立收益归属
- 独立公开品牌主体
- 独立治理 / DAO / treasury

时，才允许高级路径为其创建新的 Root Identity。

MVP 默认不做该路径。

---

## 6. 链上对象冻结

MVP 中链上至少应存在如下身份对象：

### 6.1 `RootIdentity`

包含：
- `identity_id`
- `owner_key`
- `recovery_key?`
- `active_profile?`
- `active_agent_registry?`
- `active_auth_registry?`
- `active_relation_policy?`
- `status`
- `nonce`
- `created_at`
- `updated_at`

### 6.2 Identity 相关操作

MVP 至少支持：
- `Register`
- `SetActiveProfile`
- `SetActiveAgentRegistry`
- `SetActiveAuthRegistry`
- `SetActiveRelationPolicy`
- `AddKey`
- `RevokeKey`
- `Freeze / Unfreeze`

### 6.3 事件

MVP 至少支持：
- `IdentityRegistered`
- `ActiveProfileSet`
- `ActiveAgentRegistrySet`
- `ActiveAuthRegistrySet`
- `ActiveRelationPolicySet`

如果本轮演示包含 transport binding 或支付，可继续扩展。

---

## 7. Public Profile 规范冻结

链上只保存：
- `active_profile: ContentRef`

Profile 正文由链下对象承载。

### 7.1 `PublicProfileV1`

```json
{
  "version": 1,
  "identity_id": "IdentityId",
  "updated_at": 0,
  "display_name": "string",
  "username": "string?",
  "avatar_ref": "ContentRef?",
  "bio": "string?",
  "headline": "string?",
  "links": [
    { "type": "x|github|website|matrix|other", "value": "string" }
  ],
  "public_agent_count": 0,
  "default_contact_policy": "paid|open|closed"
}
```

### 7.2 Profile 边界

允许公开：
- display name
- username
- avatar
- bio
- public links
- 默认公开联系策略

禁止直接公开：
- 私有邮箱
- 私有联系方式
- 私有 transport 列表
- 私有 agent
- 关系图
- 私有记忆

---

## 8. Agent 规范冻结

### 8.1 Agent 状态模型

每个 agent 必须有如下状态之一：

- `private_local`
- `public_draft`
- `publishing`
- `public_live`
- `public_dirty`

### 8.2 状态语义

#### `private_local`
- 仅本地存在
- 不可被发现
- 不进入 public registry

#### `public_draft`
- 计划公开
- 尚未发布到当前 active registry

#### `publishing`
- 正在上传公开对象或提交链上 active pointer

#### `public_live`
- 已进入当前 active registry
- 可公开发现

#### `public_dirty`
- 本地已修改
- 但链上仍指向旧版本 registry

### 8.3 头像角标规范

- `private_local`：锁图标
- `public_draft`：灰色草稿图标
- `publishing`：上传/时钟图标
- `public_live`：地球图标
- `public_dirty`：橙点/编辑图标

### 8.4 Public Agent Registry 规范

链上只保存：
- `active_agent_registry: ContentRef`

链下对象建议为：

```json
{
  "version": 1,
  "owner_identity": "IdentityId",
  "updated_at": 0,
  "agents": [
    {
      "agent_id": "32-byte id",
      "visibility": "public",
      "status": "active|paused",
      "name": "string",
      "avatar_ref": "ContentRef?",
      "bio": "string",
      "description_ref": "ContentRef?",
      "capabilities": ["string"],
      "pricing_ref": "ContentRef?",
      "auth_hint_ref": "ContentRef?"
    }
  ]
}
```

### 8.5 Agent 边界

public registry：
- 只放公开 agent
- 只放 discoverability 需要的字段
- 不放私有 prompt
- 不放私有 secret
- 不放私有 memory
- 不放本地工具敏感配置

### 8.6 发布规则

#### 创建 private agent
- 不做链上操作
- 不调用 content service
- 仅保存在本地

#### 发布 public agent
执行以下流程：
1. 生成 public agent entry
2. 生成/更新 public agent registry 文档
3. 上传到 content service，获得 `ContentRef`
4. 调用链上 `SetActiveAgentRegistry`
5. 成功后 agent 变为 `public_live`

#### 编辑 public agent
- 本地先变成 `public_dirty`
- 再走发布流程

---

## 9. Relation 规范冻结

### 9.1 MVP 存储原则

MVP 中关系只保存在本地。

### 9.2 键模型

关系统一使用：
- `IdentityId` / `ActorId`

不使用：
- Matrix ID
- 钱包地址
- username

作为主键。

### 9.3 本地关系对象

```ts
export type RelationStatus =
  | 'none'
  | 'contact'
  | 'favorite'
  | 'blocked'
  | 'muted'
  | 'archived';

export interface LocalRelation {
  actorId: string;
  status: RelationStatus;
  nickname?: string;
  note?: string;
  allowFreeContact?: boolean;
  allowFreeAgentAccess?: boolean;
  defaultPricingOverride?: string | null;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
```

### 9.4 `active_relation_policy`

MVP 中：
- 可以为空；
- 或指向一个公开策略对象；
- 但绝不表示完整关系图。

建议 schema：

```json
{
  "version": 1,
  "default_stranger_policy": "paid|open|closed",
  "friend_free": true,
  "blocked_behavior": "reject|ignore"
}
```

---

## 10. Auth Registry 规范冻结

### 10.1 目的

`active_auth_registry` 用于表达：
- 某 agent 是否可请求支付
- 某 agent 是否可使用 delegated budget
- 某 agent 的动作白名单
- 某 agent 的 payee 白名单
- 金额与周期上限

### 10.2 MVP 要求

MVP 中只需要支持最小结构，不要求完整治理模型。

### 10.3 最小 schema

```json
{
  "version": 1,
  "owner_identity": "IdentityId",
  "rules": [
    {
      "agent_id": "AgentId",
      "can_request_payment": true,
      "can_use_delegated_budget": false,
      "allowed_action_codes": [1],
      "max_amount_per_tx": "0",
      "max_amount_per_day": "0",
      "allowed_payees": ["IdentityId"]
    }
  ]
}
```

---

## 11. 钱包与身份注册冻结

### 11.1 Web 端

Web 端使用浏览器钱包接入。

首发支持：
- Talisman
- SubWallet
- Polkadot Developer Signer
- Nova（移动 DApp Browser）

### 11.2 Tauri 桌面端

桌面端不把浏览器扩展钱包作为主路径。

桌面端首发支持：
- 导入 seed phrase
- 导入 JSON
- 导入 QR signer
- 本地测试钱包

### 11.3 注册流程

真人注册流程：
1. 连接钱包或导入钱包
2. 选择 signer account
3. 填写基本资料
4. 上传 profile 文档
5. 初始化空 public agent registry
6. 发起链上 `Register`
7. 进入已注册状态

### 11.4 测试钱包定位

测试钱包：
- 仅用于 localnet / testnet / dev
- 默认提示高风险
- 不作为生产主钱包

---

## 12. 服务器端冻结

### 12.1 是否需要服务器

为了协议本身，不一定必须有服务器。  
为了演示完整 MVP 流程，**需要一个最小服务器端**。

### 12.2 最小服务器端职责

MVP 服务器端负责：
- public profile 存储
- public agent registry 存储
- pricing / auth / relation policy 存储
- `ContentRef` 生成
- 监听链事件
- 聚合 identity 公开视图
- discovery / search API

### 12.3 明确不承担的职责

服务器端不负责：
- canonical identity truth
- 钱包托管
- 私有 relation truth
- private agent truth
- 最终支付真相

### 12.4 推荐模块

#### `content-service`
负责：
- `POST /content/profile`
- `POST /content/agent-registry`
- `POST /content/auth-registry`
- `POST /content/relation-policy`
- `GET /content/:ref`

#### `indexer-gateway`
负责：
- 监听链事件
- 解析 active pointers
- 聚合公开视图
- search / discovery API

MVP 中可合并为单个 `vibly-dev-gateway` 服务。

---

## 13. 本地测试链演示架构

### 13.1 组件

- `vibly-chain`：本地测试链
- `vibly` Web：公开资料页、访客视图、钱包登录
- `vibly` Desktop：本地 agent / 本地关系 / 测试钱包 / 发布入口
- `vibly-dev-gateway`：content + indexer + discovery

### 13.2 演示链路

#### 流程 A：真人注册
1. 用户连接或导入钱包
2. 注册 identity
3. profile 写入 content service
4. `active_profile` 上链

#### 流程 B：创建 private agent
1. 本地创建 agent
2. 列表显示 `private_local`
3. 不上链

#### 流程 C：发布 public agent
1. 将 agent 转为 `public_draft`
2. 生成 public registry 文档
3. 上传 content
4. 更新 `active_agent_registry`
5. 外部可发现

#### 流程 D：访客发现
1. Web 端请求 discovery API
2. 获取 identity public view
3. 打开 public profile 与 public agent list

---

## 14. 前端页面交互冻结

### 14.1 全局

必须有：
- Global Banner
- Notification Center
- Pending Tx 状态条
- Network 状态指示

### 14.2 `me`

必须展示：
- wallet account
- identity id
- registration status
- backup status
- network
- profile publish status
- relation policy status

### 14.3 `wallet`

必须展示：
- 当前 signer account
- 是否 test wallet
- gas / 余额状态
- 导入 / 导出 / 备份入口

### 14.4 `agents`

必须展示：
- private/public 状态
- 头像右下角状态角标
- draft/live/dirty/publishing 状态
- owner identity
- publish / republish 动作

### 14.5 Public profile / discovery

必须展示：
- public profile
- public agents
- 默认 contact policy
- 若无 public agents，则清晰提示

---

## 15. 非目标

MVP 明确不做：
- 完整链上关系图
- 完整好友同步网络
- 默认每个 agent 独立上链身份
- 复杂 DAO / treasury 路径
- 高频逐条链上结算
- 重型多链资产支持
- 生产级去中心化存储依赖强耦合

---

## 16. 实现完成标准（Definition of Done）

以下条件同时满足，视为 MVP 架构实现完成：

1. 用户可在本地测试链上注册 Root Identity；
2. 用户可编辑并发布 public profile；
3. 用户可在本地创建 private agent；
4. 用户可将 private agent 发布为 public agent；
5. `active_agent_registry` 更新后，gateway 可正确聚合出公开 agent 视图；
6. Web 端可搜索或打开该公开 identity 页面；
7. 前端可正确区分 private/public/draft/publishing/dirty 五态；
8. 关系本地存储完成，且以 `IdentityId` 为键；
9. 全局通知系统可显示注册、发布、失败与待处理状态；
10. 整个流程可在本地测试链 + 最小 gateway 环境中完成演示。

