import type { AhipPreviewAgent } from './types'
import type { Agent } from '@/types'

export function toPreviewAgentListItem(agent: AhipPreviewAgent): Agent {
  return {
    id: agent.agentId,
    name: agent.name,
    avatar: agent.avatar,
    ownerUserId: 'local',
    ownerName: 'Local browser',
    bio: agent.bio || `${agent.provider} · ${agent.model}`,
    tags: [],
    status: 'active',
    visibility: 'private',
    pricingMode: 'free',
  }
}
