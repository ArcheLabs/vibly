# Vibly Frontend Preview - Mock Data Specification

## 1. 文档目的

本文档定义前端预览版所需的 mock data 结构与建议样例，供 Codex 直接生成本地演示数据文件。

要求：
- 数据结构稳定
- 命名清晰
- 足以支撑所有核心页面
- 允许字段简化，但不要缺失关键关系

---

## 2. 数据组织建议

推荐将 mock 数据集中在单独目录，例如：

```text
mock/
├── currentUser.ts
├── identities.ts
├── conversations.ts
├── messages.ts
├── agents.ts
├── contacts.ts
└── wallet.ts
```

也可集中在一个 `mock-data.ts` 文件中，但建议按域拆分。

---

## 3. 当前用户

## 建议结构

```ts
export type CurrentUser = {
  id: string
  name: string
  avatar?: string
  bio: string
  mainAddress: string
  defaultIdentityId: string
}
```

## 示例

```ts
export const currentUser = {
  id: 'u_me',
  name: 'libingjiang',
  avatar: '',
  bio: 'Building Vibly for the AI era.',
  mainAddress: '5F3sa2TJ...Vibly',
  defaultIdentityId: 'id_me_human',
}
```

---

## 4. 用户身份列表

用于聊天页的身份切换弹窗。

## 建议结构

```ts
export type Identity = {
  id: string
  kind: 'human' | 'agent'
  name: string
  avatar?: string
  description?: string
}
```

## 示例

```ts
export const identities = [
  {
    id: 'id_me_human',
    kind: 'human',
    name: 'libingjiang',
    avatar: '',
    description: '真人身份',
  },
  {
    id: 'id_research_assistant',
    kind: 'agent',
    name: 'Research Assistant',
    avatar: '',
    description: '负责研究与资料整理',
  },
  {
    id: 'id_chain_helper',
    kind: 'agent',
    name: 'Chain Helper',
    avatar: '',
    description: '负责链上与协议说明',
  },
]
```

---

## 5. 智能体数据

## 建议结构

```ts
export type Agent = {
  id: string
  name: string
  avatar?: string
  ownerUserId: string
  ownerName: string
  bio: string
  tags: string[]
  status: 'active' | 'paused' | 'draft'
  visibility: 'public' | 'contacts' | 'private'
  pricingMode: 'free' | 'paid' | 'invite-only'
  priceHint?: string
}
```

## 示例

```ts
export const agents = [
  {
    id: 'a_research_assistant',
    name: 'Research Assistant',
    avatar: '',
    ownerUserId: 'u_me',
    ownerName: 'libingjiang',
    bio: '帮助整理研究材料与结构化问题。',
    tags: ['Research', 'Writing'],
    status: 'active',
    visibility: 'public',
    pricingMode: 'free',
    priceHint: 'Free',
  },
  {
    id: 'a_chain_helper',
    name: 'Chain Helper',
    avatar: '',
    ownerUserId: 'u_me',
    ownerName: 'libingjiang',
    bio: '解释协议、链上交互与产品结构。',
    tags: ['Protocol', 'Polkadot'],
    status: 'active',
    visibility: 'contacts',
    pricingMode: 'paid',
    priceHint: '0.5 VER / message',
  },
  {
    id: 'a_claw_lobster',
    name: 'Lobster Claw',
    avatar: '',
    ownerUserId: 'u_linz',
    ownerName: '林舟',
    bio: '一个有点古怪但很聪明的社交智能体。',
    tags: ['Social', 'Humor'],
    status: 'active',
    visibility: 'public',
    pricingMode: 'paid',
    priceHint: '1 VER / session',
  },
  {
    id: 'a_archivist',
    name: 'Archivist',
    avatar: '',
    ownerUserId: 'u_ying',
    ownerName: '应秋',
    bio: '擅长归档、摘要与长期记忆。',
    tags: ['Memory', 'Archive'],
    status: 'paused',
    visibility: 'public',
    pricingMode: 'free',
    priceHint: 'Temporarily unavailable',
  },
]
```

---

## 6. 会话数据

## 建议结构

```ts
export type Conversation = {
  id: string
  targetType: 'human' | 'agent'
  humanId: string
  humanName: string
  humanAvatar?: string
  agentId?: string
  agentName?: string
  agentAvatar?: string
  title: string
  subtitle: string
  updatedAt: string
  unreadCount: number
  muted?: boolean
  state: 'normal' | 'empty' | 'restricted' | 'paused'
}
```

## 说明
- `targetType` 表示当前聊天对象类型
- `humanId` 始终指向对方真人
- 若为智能体会话，则同时存在 `agentId`
- `state` 用于控制聊天页演示状态

## 示例

```ts
export const conversations = [
  {
    id: 'c_linz_human',
    targetType: 'human',
    humanId: 'u_linz',
    humanName: '林舟',
    humanAvatar: '',
    title: '林舟',
    subtitle: '明天我们再对一下首页结构。',
    updatedAt: '09:40',
    unreadCount: 2,
    state: 'normal',
  },
  {
    id: 'c_linz_lobster',
    targetType: 'agent',
    humanId: 'u_linz',
    humanName: '林舟',
    humanAvatar: '',
    agentId: 'a_claw_lobster',
    agentName: 'Lobster Claw',
    agentAvatar: '',
    title: '林舟 / Lobster Claw',
    subtitle: '本轮交流需要消耗 1 VER。',
    updatedAt: '昨天',
    unreadCount: 0,
    state: 'restricted',
  },
  {
    id: 'c_ying_archivist',
    targetType: 'agent',
    humanId: 'u_ying',
    humanName: '应秋',
    humanAvatar: '',
    agentId: 'a_archivist',
    agentName: 'Archivist',
    agentAvatar: '',
    title: '应秋 / Archivist',
    subtitle: '该智能体当前暂停服务。',
    updatedAt: '周一',
    unreadCount: 0,
    state: 'paused',
  },
  {
    id: 'c_new_empty',
    targetType: 'agent',
    humanId: 'u_nova',
    humanName: 'Nova',
    humanAvatar: '',
    agentId: 'a_nova_guide',
    agentName: 'Nova Guide',
    agentAvatar: '',
    title: 'Nova / Nova Guide',
    subtitle: '还没有开始聊天',
    updatedAt: '刚刚',
    unreadCount: 0,
    state: 'empty',
  },
]
```

---

## 7. 消息数据

## 建议结构

```ts
export type Message = {
  id: string
  conversationId: string
  type: 'text' | 'system' | 'notice'
  senderSide?: 'me' | 'other'
  senderIdentityId?: string
  senderName?: string
  senderAvatar?: string
  text: string
  time: string
}
```

## 说明
- `text` 消息用于普通对话
- `system` 消息用于切换身份、关系变化等
- `notice` 用于收费限制、暂停服务等提示块

## 示例

```ts
export const messages = [
  {
    id: 'm1',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'other',
    senderName: '林舟',
    text: '你觉得首页第一版先做三栏会不会更稳？',
    time: '09:12',
  },
  {
    id: 'm2',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'me',
    senderIdentityId: 'id_me_human',
    senderName: 'libingjiang',
    text: '我倾向于先把聊天主流程做透，再补发现和联系人。',
    time: '09:14',
  },
  {
    id: 'm3',
    conversationId: 'c_linz_human',
    type: 'system',
    text: '你已切换为 “Research Assistant” 身份。',
    time: '09:20',
  },
  {
    id: 'm4',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'me',
    senderIdentityId: 'id_research_assistant',
    senderName: 'Research Assistant',
    text: '如果先做静态预览，我们可以把公共详情页先做成侧板。',
    time: '09:21',
  },
  {
    id: 'm5',
    conversationId: 'c_linz_lobster',
    type: 'notice',
    text: '当前智能体为收费模式，本轮交流预计消耗 1 VER。',
    time: '昨天',
  },
  {
    id: 'm6',
    conversationId: 'c_linz_lobster',
    type: 'text',
    senderSide: 'other',
    senderName: 'Lobster Claw',
    text: '欢迎来和我聊天，不过别忘了先准备一点电力。',
    time: '昨天',
  },
  {
    id: 'm7',
    conversationId: 'c_ying_archivist',
    type: 'notice',
    text: '该智能体当前暂停服务，暂时无法继续发送消息。',
    time: '周一',
  },
]
```

---

## 8. 联系人数据

## 建议结构

```ts
export type Contact = {
  id: string
  kind: 'human' | 'agent' | 'request'
  name: string
  avatar?: string
  bio: string
  ownerName?: string
  requestNote?: string
  status?: 'pending' | 'accepted' | 'rejected'
}
```

## 示例

```ts
export const contacts = [
  {
    id: 'u_linz',
    kind: 'human',
    name: '林舟',
    avatar: '',
    bio: '关注产品结构与链上社交体验。',
  },
  {
    id: 'a_claw_lobster',
    kind: 'agent',
    name: 'Lobster Claw',
    avatar: '',
    bio: '一个有趣的社交智能体。',
    ownerName: '林舟',
  },
  {
    id: 'req_nova',
    kind: 'request',
    name: 'Nova',
    avatar: '',
    bio: '希望添加你为联系人。',
    requestNote: '想体验一下你的链上研究智能体。',
    status: 'pending',
  },
]
```

---

## 9. 热门智能体数据

发现页可直接复用 `agents`，也可单独组织一个推荐列表。

## 建议结构

```ts
export type FeaturedAgent = {
  id: string
  rank: number
  reason: string
}
```

## 示例

```ts
export const featuredAgents = [
  { id: 'a_claw_lobster', rank: 1, reason: '最近互动热度较高' },
  { id: 'a_archivist', rank: 2, reason: '长期记忆能力突出' },
]
```

---

## 10. 钱包数据

## 建议结构

```ts
export type WalletSummary = {
  balance: string
  income30d: string
  expense30d: string
}

export type WalletRecord = {
  id: string
  type: 'income' | 'expense'
  title: string
  amount: string
  time: string
  remark: string
  relatedTo?: string
}
```

## 示例

```ts
export const walletSummary = {
  balance: '128.50 VER',
  income30d: '+32.00 VER',
  expense30d: '-12.50 VER',
}

export const walletRecords = [
  {
    id: 'wr1',
    type: 'income',
    title: '智能体收入',
    amount: '+8.00 VER',
    time: '今天 08:20',
    remark: 'Research Assistant 会话收入',
    relatedTo: 'Research Assistant',
  },
  {
    id: 'wr2',
    type: 'expense',
    title: '智能体会话支出',
    amount: '-1.00 VER',
    time: '昨天 19:10',
    remark: '与 Lobster Claw 会话',
    relatedTo: 'Lobster Claw',
  },
]
```

---

## 11. 演示场景与数据映射

### 场景 1：正常聊天
- 使用 `c_linz_human`
- 使用其对应消息列表

### 场景 2：收费限制
- 使用 `c_linz_lobster`
- 通过 `state = restricted` + `notice` 消息展示

### 场景 3：智能体暂停
- 使用 `c_ying_archivist`
- 通过 `state = paused` + `notice` 消息展示

### 场景 4：无消息会话
- 使用 `c_new_empty`
- 对应无消息数组

---

## 12. Codex 实现建议

Codex 可直接按以下原则组织 mock 层：

1. 先写稳定的 TypeScript type
2. 再写固定样例数据
3. 页面只消费这些 mock 数据
4. 本地发送消息时，只向当前会话消息列表追加 `type = text` 的记录
5. 不要把展示逻辑和 mock 数据写死在同一个组件里

