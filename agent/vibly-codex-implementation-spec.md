# Vibly Codex 实现规范（MVP）

状态：可直接交给 Codex 开发  
范围：前端、最小服务端、本地测试链联调  
前置文档：`vibly-mvp-architecture-freeze.md`

---

## 1. 目标

实现一个可在本地测试链演示的 MVP，支持：

1. 钱包接入或导入；
2. 真人注册 Root Identity；
3. 编辑并发布 public profile；
4. 创建 private/public 两类 agent；
5. 将 public agent 发布到链下 public registry，并把 active pointer 提交到链上；
6. 通过 gateway 提供公开发现与公开 profile 读取；
7. 前端完整显示 publish / dirty / private 状态；
8. 关系仅本地存储，但具备未来扩展接口。

---

## 2. 交付物

Codex 必须交付以下内容：

### 2.1 前端（`vibly`）
- Wallet onboarding
- Identity registration flow
- Profile editor + publish
- Agents list / create / edit / publish
- Local relation store
- Global banners / notifications
- Public profile page
- Discovery page（最小版）

### 2.2 最小服务端（推荐 `apps/dev-gateway`）
- content upload APIs
- content read API
- chain event indexer
- aggregated public identity API
- aggregated public agent API
- minimal search/discovery API

### 2.3 联调脚本
- 本地测试链启动脚本
- gateway 启动脚本
- 前端启动脚本
- 演示初始化脚本（可选）

---

## 3. 技术约束

### 3.1 钱包接入

#### Web
- 使用 PAPI 作为链交互主库
- 使用兼容浏览器扩展的钱包接入层
- 首发支持：Talisman / SubWallet / Polkadot Developer Signer / Nova（移动）

#### Desktop（Tauri）
- 不把浏览器扩展当主路径
- 支持：seed phrase / JSON / QR signer / test wallet

### 3.2 客户端数据分层

前端必须明确分出：
- `chain state`
- `public content state`
- `local private state`
- `derived ui state`

### 3.3 状态管理

建议：
- 查询状态：TanStack Query
- 本地全局状态：Zustand 或等价轻量方案
- 本地持久化：IndexedDB / SQLite（桌面）/ local storage（临时）

### 3.4 代码组织

建议目录：

```text
src/
  modules/
    wallet/
    identity/
    profile/
    agents/
    relations/
    notifications/
    discovery/
    chain/
    gateway/
  components/
  routes/
  stores/
  lib/
```

---

## 4. 前端模块规范

## 4.1 Wallet 模块

### 目标
支持 Web 钱包连接、桌面端导入账户与测试钱包。

### 需要实现的能力
- detect wallets（Web）
- connect wallet（Web）
- import seed
- import JSON
- import QR signer
- create test wallet
- select active signer account
- display account list
- network mismatch handling
- gas/balance checks

### UI 页面/弹窗
- Wallet onboarding page
- Wallet selector modal
- Account picker modal
- Import wallet modal
- Create test wallet modal

### 状态机
- `idle`
- `detecting`
- `wallets_available`
- `wallet_connected`
- `account_selected`
- `network_mismatch`
- `insufficient_gas`
- `error`

### 数据结构

```ts
interface WalletAccount {
  id: string;
  source: 'extension' | 'seed' | 'json' | 'qr' | 'test';
  name?: string;
  address: string;
  publicKeyHex: string;
  isTestWallet: boolean;
  isReadOnly: boolean;
}
```

---

## 4.2 Identity 模块

### 目标
支持 Root Identity 注册、读取、状态展示与 active pointer 更新。

### 需要实现的能力
- query identity by wallet / address
- register identity
- display identity status
- update active profile pointer
- update active agent registry pointer
- update active auth registry pointer
- update active relation policy pointer

### UI 页面
- Identity registration page
- Identity summary card
- Pointer status section

### 状态机
- `not_registered`
- `registering_profile_upload`
- `registering_chain_tx`
- `registered`
- `frozen`
- `error`

### 数据结构

```ts
interface IdentitySummary {
  identityId: string;
  ownerAddress: string;
  status: 'active' | 'frozen' | 'disabled';
  activeProfileRef?: string | null;
  activeAgentRegistryRef?: string | null;
  activeAuthRegistryRef?: string | null;
  activeRelationPolicyRef?: string | null;
}
```

---

## 4.3 Profile 模块

### 目标
编辑 public profile，并发布到 content service + 链上 active pointer。

### 需要实现的能力
- edit public profile draft
- upload avatar asset
- publish profile content
- submit `SetActiveProfile`
- show publish status

### 页面
- `me` page profile section
- profile editor drawer/modal
- public profile preview page

### Profile 本地状态
- `draft`
- `publishing`
- `published`
- `dirty`
- `error`

### 数据结构

```ts
interface PublicProfileDraft {
  version: 1;
  identityId?: string;
  displayName: string;
  username?: string;
  avatarRef?: string | null;
  bio?: string;
  headline?: string;
  links: Array<{ type: string; value: string }>;
  defaultContactPolicy: 'paid' | 'open' | 'closed';
}
```

---

## 4.4 Agents 模块

### 目标
支持 private/public agent 创建、编辑、发布与状态区分。

### 必须支持的 agent 状态
- `private_local`
- `public_draft`
- `publishing`
- `public_live`
- `public_dirty`

### 数据结构

```ts
interface AgentRecord {
  agentId: string;
  ownerIdentityId?: string;
  name: string;
  avatarRef?: string | null;
  bio?: string;
  description?: string;
  visibility: 'private' | 'public';
  publishState:
    | 'private_local'
    | 'public_draft'
    | 'publishing'
    | 'public_live'
    | 'public_dirty';
  status: 'active' | 'paused';
  capabilities: string[];
  pricingMode: 'free' | 'per_message' | 'per_session';
  pricingRef?: string | null;
  authHintRef?: string | null;
  updatedAt: number;
}
```

### 页面
- agents list page
- create agent page
- edit agent page
- publish agent modal
- public agent preview page

### UI 规则
#### 列表卡片必须显示
- avatar
- name
- bio
- visibility
- publish state
- owner identity
- revenue recipient = current identity
- status

#### 头像角标必须显示
- 锁图标：private_local
- 草稿图标：public_draft
- 上传/时钟图标：publishing
- 地球图标：public_live
- 橙点/编辑图标：public_dirty

### 核心流程
#### Create private agent
- 本地生成 `agentId`
- 保存到 local store
- publishState = `private_local`
- 不调用服务端
- 不发链上交易

#### Convert private -> public draft
- 切换 visibility = `public`
- publishState = `public_draft`
- 打开 publish confirmation

#### Publish agent
1. 从本地 agent 生成 public agent entry
2. 读取当前 public registry 草稿
3. 更新 registry 文档
4. 上传 `agent-registry` 内容
5. 如有权限配置，上传 `auth-registry`
6. 调链上 `SetActiveAgentRegistry`
7. 如有权限配置，再调 `SetActiveAuthRegistry`
8. 成功后标记 `public_live`

#### Edit public live agent
- 修改本地 draft
- publishState = `public_dirty`
- UI 显示 `Republish`

---

## 4.5 Relations 模块

### 目标
只实现本地关系存储，但预留未来同步接口。

### 数据结构

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

### 必须实现的接口

```ts
interface RelationStore {
  get(actorId: string): Promise<LocalRelation | null>;
  set(actorId: string, patch: Partial<LocalRelation>): Promise<void>;
  remove(actorId: string): Promise<void>;
  list(): Promise<LocalRelation[]>;
}

interface RelationPolicyResolver {
  isFreeContact(actorId: string): Promise<boolean>;
  isBlocked(actorId: string): Promise<boolean>;
  getPricingOverride(actorId: string): Promise<string | null>;
}
```

### 页面需求
- 对方资料页中可设置 contact/favorite/block
- `me` 页面暂不展示完整关系图，但可展示计数摘要

---

## 4.6 Notification 模块

### 目标
实现全局通知系统，包含 toast + banner + notification center。

### 类型
#### Toast
- copy success
- tx submitted
- tx failed
- wallet connected

#### Global Banner
- using test wallet
- unsupported network
- wallet not backed up
- identity not registered
- pending publish
- insufficient gas

#### Notification Center
- identity registered
- profile published
- agent published
- agent republish required
- chain tx confirmed/failed

### 数据结构

```ts
interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'identity' | 'profile' | 'agent' | 'wallet' | 'system';
  title: string;
  message?: string;
  createdAt: number;
  read: boolean;
}
```

---

## 4.7 Discovery 模块

### 目标
展示公开 identity 与公开 agent。

### 页面
- discovery list page
- public identity page
- public agent list section

### API 依赖
- `GET /identity/:identityId`
- `GET /identity/:identityId/agents`
- `GET /search?q=...`

---

## 5. 服务端实现规范

## 5.1 推荐目录

```text
apps/dev-gateway/
  src/
    content/
    indexer/
    api/
    storage/
```

## 5.2 Content Service API

### `POST /content/profile`
输入：`PublicProfileV1`  
输出：

```json
{ "contentRef": "string", "hash": "string" }
```

### `POST /content/agent-registry`
输入：registry 文档  
输出：`contentRef`

### `POST /content/auth-registry`
输入：auth registry 文档  
输出：`contentRef`

### `POST /content/relation-policy`
输入：relation policy 文档  
输出：`contentRef`

### `GET /content/:ref`
输出：原始 JSON 内容

## 5.3 Gateway / Aggregation API

### `GET /identity/:identityId`
返回：

```json
{
  "identityId": "string",
  "status": "active",
  "profile": {},
  "activeProfileRef": "string",
  "activeAgentRegistryRef": "string",
  "activeAuthRegistryRef": "string",
  "activeRelationPolicyRef": "string"
}
```

### `GET /identity/:identityId/agents`
返回公开 agent 列表。

### `GET /agent/:agentId`
返回单个公开 agent 详情。

### `GET /search?q=`
最小返回：
- identities
- public agents

## 5.4 Indexer 行为

必须监听：
- `IdentityRegistered`
- `ActiveProfileSet`
- `ActiveAgentRegistrySet`
- `ActiveAuthRegistrySet`
- `ActiveRelationPolicySet`

并把链上指针解析成公开视图缓存。

---

## 6. 页面规范

## 6.1 Onboarding

### 必须有的入口
- Connect Wallet
- Import Existing Wallet
- Create Test Wallet

### 必须有的说明
- Wallet account is used for signing
- Identity is registered on-chain
- Test wallet is unsafe for production

## 6.2 `me`

### 区块
- Profile
- Identity & Account
- Preferences
- Security
- About

### 当前轮必须补齐的字段
#### Profile
- avatar
- display name
- bio
- public profile publish status

#### Identity & Account
- wallet address
- identity id
- registration status
- pointers summary

#### Security
- backup status
- imported/test wallet tag
- key summary（最小版可只显示 owner wallet）

#### About
- current network
- RPC endpoint
- app version

## 6.3 `wallet`

### 当前轮目标
wallet 页面不是资产钱包 MVP 的重点，本轮只做：
- current signer account
- test wallet warning
- balance / gas summary
- import/export/backup actions

## 6.4 `agents`

### 列表页
必须有：
- create button
- filter tabs: all / private / public / draft
- status icon overlay
- publish / republish action
- edit action

### 详情页
必须有：
- basic info
- persona / behavior
- access & visibility
- pricing
- permissions
- on-chain publishing

### `On-chain Publishing` 区块
必须显示：
- owner identity
- current registry ref
- publish state
- last published at
- publish / republish button

---

## 7. 链上交互规范

## 7.1 Register Identity

前端流程：
1. build profile content
2. upload profile
3. build empty agent registry content
4. upload agent registry
5. submit `Register`

## 7.2 Publish Profile

前端流程：
1. upload profile
2. get `contentRef`
3. submit `SetActiveProfile`

## 7.3 Publish Agent

前端流程：
1. build public registry
2. upload registry
3. submit `SetActiveAgentRegistry`
4. if needed, upload auth registry
5. submit `SetActiveAuthRegistry`

## 7.4 Relation Policy（可选）

如本轮实现：
1. build policy
2. upload policy
3. submit `SetActiveRelationPolicy`

---

## 8. 错误态与恢复

Codex 必须覆盖以下错误态：

### 钱包
- no wallet detected
- user rejected connection
- unsupported network
- insufficient gas
- invalid account import

### Identity
- registration rejected
- register tx failed
- profile upload failed
- pointer update failed

### Agent
- publish upload failed
- registry update failed
- local/public state mismatch

### Gateway
- content not found
- chain/indexer lagging
- public view not ready

### 恢复动作
每个错误都至少提供以下之一：
- retry
- return to draft
- copy error details
- open diagnostics

---

## 9. 本地存储规范

建议至少区分以下 store：

- `wallet_accounts`
- `identity_cache`
- `profile_drafts`
- `agents_local`
- `relations_local`
- `notifications`
- `ui_preferences`

禁止把以下内容误存到公开对象：
- private agent prompt
- local memory
- secret keys
- private notes

---

## 10. 开发顺序

### 阶段 1
- wallet onboarding
- account selection
- identity registration
- profile publish

### 阶段 2
- agent local CRUD
- private/public state model
- publish agent flow

### 阶段 3
- dev gateway
- discovery page
- public profile page

### 阶段 4
- relation local store
- auth registry minimal support
- global notification center polish

---

## 11. 验收标准

### 11.1 真人注册
- 用户可连接/导入/创建测试钱包
- 用户可注册 identity
- `me` 页面能看到 wallet address + identity id

### 11.2 Profile
- 用户可编辑 public profile
- 用户可发布并更新 active profile pointer
- public profile page 可读取显示

### 11.3 Agents
- 用户可创建 private agent
- 用户可将 private agent 发布为 public agent
- agents 列表可正确显示五种 publish state
- Web 端可读取 public agent list

### 11.4 Relations
- 用户可本地标记 contact/favorite/block
- 关系键使用 `IdentityId`

### 11.5 Gateway
- 可通过 identity id 获取聚合后的公开 identity 视图
- 可获取公开 agent 列表

