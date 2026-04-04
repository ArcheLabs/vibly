import { appConfig } from '@/modules/config/env'
import type {
  AuthRegistryV1,
  ContentEnvelope,
  ContentKind,
  PublicAgentRegistryV1,
  PublicProfileV1,
  RelationPolicyV1,
} from '@/modules/content/schemas'
import type { IdentitySummary } from '@/modules/identity/types'

export interface AggregatedIdentityView {
  identityId: string
  status: IdentitySummary['status']
  profile: PublicProfileV1 | null
  activeProfileRef?: string | null
  activeAgentRegistryRef?: string | null
  activeAuthRegistryRef?: string | null
  activeRelationPolicyRef?: string | null
}

export interface SearchResponse {
  identities: AggregatedIdentityView[]
  publicAgents: Array<{
    agentId: string
    ownerIdentityId: string
    name: string
    bio: string
    status: 'active' | 'paused'
    capabilities: string[]
  }>
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.gatewayEndpoint}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function uploadContent<T extends PublicProfileV1 | PublicAgentRegistryV1 | AuthRegistryV1 | RelationPolicyV1>(
  kind: ContentKind,
  payload: T,
): Promise<Pick<ContentEnvelope, 'ref' | 'hash'> & { contentRef: string }> {
  const endpointMap: Record<ContentKind, string> = {
    profile: '/content/profile',
    'agent-registry': '/content/agent-registry',
    'auth-registry': '/content/auth-registry',
    'relation-policy': '/content/relation-policy',
  }

  return request(endpointMap[kind], {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function readContent(ref: string) {
  return request(`/content/${encodeURIComponent(ref)}`)
}

export async function getIdentity(identityId: string) {
  return request<AggregatedIdentityView>(`/identity/${encodeURIComponent(identityId)}`)
}

export async function getIdentityAgents(identityId: string) {
  return request<PublicAgentRegistryV1['agents']>(`/identity/${encodeURIComponent(identityId)}/agents`)
}

export async function searchGateway(query: string) {
  return request<SearchResponse>(`/search?q=${encodeURIComponent(query)}`)
}

