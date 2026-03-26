# Vibly Frontend Preview - Component Specification

## 1. 文档目的

本文档定义前端预览版应优先抽象的组件，用于保证页面实现可复用、结构稳定，并减少 Codex 直接复制页面片段造成的重复代码。

本轮组件的目标不是形成正式设计系统，而是提供一组稳定的页面骨架组件。

---

## 2. 组件设计原则

1. 先保证页面能拼装出来
2. 优先抽象高复用结构
3. 不过度抽象为复杂通用组件
4. 所有组件都默认使用 mock data 驱动
5. 组件命名清晰，优先表达业务意义

---

## 3. 核心布局组件

# 3.1 AppShell

## 用途
全局三栏布局容器。

## 组成
- SideNav
- ListPanel
- MainPanel

## 输入
- currentPage
- onChangePage
- children

## 预览版说明
必须作为所有一级页面的共同外壳。

---

# 3.2 SideNav

## 用途
展示一级导航。

## 组成
- 品牌区或顶部头像位
- 导航项列表
- 可选底部设置入口

## 输入
- navItems
- activeKey
- onSelect

## 预览版说明
导航项固定为：聊天、智能体、发现、联系人、钱包、我的。

---

# 3.3 ListPanel

## 用途
一级页面左侧列表区的统一容器。

## 组成
- 顶部操作区
- 内容滚动区

## 输入
- header
- children

## 预览版说明
用于承载会话列表、智能体列表、联系人列表、钱包记录列表等。

---

# 3.4 MainPanel

## 用途
右侧交互区统一容器。

## 输入
- children

## 预览版说明
用于承载聊天详情、资料详情、钱包详情、设置区等。

---

## 4. 基础通用组件

# 4.1 SearchBar

## 用途
统一的搜索输入组件。

## 输入
- placeholder
- value
- onChange

## 预览版说明
可不做真实搜索逻辑。

---

# 4.2 SectionHeader

## 用途
列表区分组标题或小节标题。

## 输入
- title
- action

---

# 4.3 EmptyState

## 用途
展示空状态、占位状态、开发中状态。

## 输入
- title
- description
- actionLabel
- onAction

## 预览版说明
多个页面都会复用。

---

# 4.4 Badge

## 用途
展示轻量标签，例如：
- 真人
- 智能体
- 收费
- 停用
- 热门

## 输入
- label
- variant

---

# 4.5 Avatar

## 用途
展示头像。

## 类型
- 真人头像
- 智能体头像
- 默认占位头像

## 输入
- src
- alt
- size
- onClick

---

# 4.6 CompositeAvatar

## 用途
展示真人头像 + 智能体角标头像的组合头像。

## 输入
- userAvatar
- agentAvatar
- size

## 预览版说明
聊天列表和聊天头部都可复用。

---

## 5. 聊天域组件

# 5.1 ConversationList

## 用途
会话列表容器。

## 输入
- items
- activeId
- onSelect

## 预览版说明
按 mock 数据渲染会话列表。

---

# 5.2 ConversationListItem

## 用途
单个会话列表项。

## 必须展示
- 头像
- 标题
- 摘要
- 时间
- 未读数

## 输入
- item
- active
- onClick

---

# 5.3 ChatHeader

## 用途
聊天详情头部。

## 必须展示
- 当前聊天对象
- 资料入口
- 当前用户身份切换入口

## 输入
- conversation
- currentIdentity
- onOpenUserProfile
- onOpenAgentProfile
- onToggleIdentitySwitcher

---

# 5.4 IdentitySwitcher

## 用途
切换用户当前发言身份。

## 输入
- identities
- activeIdentityId
- onSelect
- onClose

## 预览版说明
必须能以弹窗、下拉层或 popover 形式工作。

---

# 5.5 MessageList

## 用途
消息记录列表。

## 输入
- messages

## 预览版说明
支持文本消息、系统消息、提示消息。

---

# 5.6 MessageBubble

## 用途
渲染单条普通消息。

## 输入
- message
- direction

## 必须内容
- 头像
- 名称或身份说明
- 文本内容
- 时间

---

# 5.7 SystemMessage

## 用途
渲染居中系统消息。

## 输入
- text

---

# 5.8 NoticeCard

## 用途
渲染限制、收费、停用等提示块。

## 输入
- title
- description
- actionLabel
- onAction

---

# 5.9 Composer

## 用途
聊天输入区。

## 输入
- value
- onChange
- onSend
- currentIdentity
- disabled
- hint

## 预览版说明
允许使用本地状态实现简单发送演示。

---

## 6. 资料与列表组件

# 6.1 UserCard

## 用途
展示真人资料卡。

## 输入
- user
- actions

## 场景
- 用户信息页
- 联系人详情

---

# 6.2 AgentCard

## 用途
展示智能体资料卡。

## 输入
- agent
- owner
- actions

## 场景
- 发现页右侧详情
- 智能体信息页
- 联系人详情

---

# 6.3 ProfilePanel

## 用途
统一承载用户信息页与智能体信息页。

## 输入
- title
- onClose
- children

## 预览版说明
若实现为抽屉或侧板，可复用此组件。

---

# 6.4 AgentListItem

## 用途
我的智能体列表项。

## 输入
- agent
- active
- onClick

---

# 6.5 ContactListItem

## 用途
联系人列表项。

## 输入
- contact
- active
- onClick

---

# 6.6 WalletRecordItem

## 用途
钱包记录列表项。

## 输入
- record
- active
- onClick

---

## 7. 钱包与设置组件

# 7.1 WalletSummary

## 用途
展示余额与资产概览。

## 输入
- balance
- income
- expense

---

# 7.2 RecordDetail

## 用途
展示单条钱包记录详情。

## 输入
- record

---

# 7.3 SettingsSection

## 用途
我的页中的设置分区容器。

## 输入
- title
- description
- children

---

## 8. 推荐组件拆分层级

```text
components/
├── layout/
│   ├── AppShell
│   ├── SideNav
│   ├── ListPanel
│   └── MainPanel
├── common/
│   ├── SearchBar
│   ├── EmptyState
│   ├── Badge
│   ├── Avatar
│   └── CompositeAvatar
├── chat/
│   ├── ConversationList
│   ├── ConversationListItem
│   ├── ChatHeader
│   ├── IdentitySwitcher
│   ├── MessageList
│   ├── MessageBubble
│   ├── SystemMessage
│   ├── NoticeCard
│   └── Composer
├── profile/
│   ├── ProfilePanel
│   ├── UserCard
│   └── AgentCard
├── agents/
│   └── AgentListItem
├── contacts/
│   └── ContactListItem
└── wallet/
    ├── WalletSummary
    └── WalletRecordItem
```

---

## 9. 组件实现约束

Codex 实现时必须遵守：

1. 相同结构的列表项优先抽组件
2. 聊天域组件必须独立于页面文件
3. 用户信息与智能体信息应共享统一详情容器
4. mock 数据不要写死在组件内部，应集中到数据文件
5. 不为了预览版引入复杂 hooks 或状态架构

---

## 10. 最小必须组件清单

若需要压缩实现范围，至少必须有：

1. AppShell
2. SideNav
3. ConversationList
4. ConversationListItem
5. ChatHeader
6. IdentitySwitcher
7. MessageList
8. Composer
9. EmptyState
10. AgentCard
11. UserCard
12. ProfilePanel

