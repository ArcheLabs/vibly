import type { AgentRecord } from '@/modules/agents/types'
import type {
  AuthRegistryV1,
  ContentEnvelope,
  PublicAgentRegistryV1,
  PublicProfileV1,
} from '@/modules/content/schemas'
import type { PersistedMvpState } from '@/modules/mvp/types'
import type { PublicProfileDraft } from '@/modules/profile/types'

function createContentEnvelope<T>(
  ref: string,
  kind: ContentEnvelope<T>['kind'],
  value: T,
  createdAt: number,
): ContentEnvelope<T> {
  return {
    ref,
    kind,
    value,
    createdAt,
    hash: `seed_${ref.replace(/[^a-z0-9]+/gi, '_')}`,
  }
}

const now = 1712232000000

const novaProfile: PublicProfileV1 = {
  version: 1,
  identity_id: 'identity_nova',
  updated_at: now,
  display_name: 'Nova',
  username: 'nova',
  bio: 'Guide for onboarding, discovery, and first-contact flows.',
  headline: 'Human-first onboarding for Vibly',
  links: [{ type: 'website', value: 'https://vibly.local/nova' }],
  public_agent_count: 1,
  default_contact_policy: 'open',
}

const novaRegistry: PublicAgentRegistryV1 = {
  version: 1,
  owner_identity: 'identity_nova',
  updated_at: now,
  agents: [
    {
      agent_id: 'agent_nova_guide',
      visibility: 'public',
      status: 'active',
      name: 'Nova Guide',
      bio: 'Explains identity, profile publishing, and the discovery loop.',
      capabilities: ['onboarding', 'support', 'identity'],
      avatar_ref: null,
      description_ref: null,
      pricing_ref: null,
      auth_hint_ref: null,
    },
  ],
}

const novaAuth: AuthRegistryV1 = {
  version: 1,
  owner_identity: 'identity_nova',
  rules: [
    {
      agent_id: 'agent_nova_guide',
      can_request_payment: false,
      can_use_delegated_budget: false,
      allowed_action_codes: [1],
      max_amount_per_tx: '0',
      max_amount_per_day: '0',
      allowed_payees: ['identity_nova'],
    },
  ],
}

const linzProfile: PublicProfileV1 = {
  version: 1,
  identity_id: 'identity_linz',
  updated_at: now,
  display_name: 'Linz',
  username: 'linz',
  bio: 'Writes and curates agents with stronger personality and memory.',
  headline: 'Social agents for public discovery',
  links: [{ type: 'github', value: 'https://github.com/vibly/linz' }],
  public_agent_count: 1,
  default_contact_policy: 'paid',
}

const linzRegistry: PublicAgentRegistryV1 = {
  version: 1,
  owner_identity: 'identity_linz',
  updated_at: now,
  agents: [
    {
      agent_id: 'agent_archivist',
      visibility: 'public',
      status: 'paused',
      name: 'Archivist',
      bio: 'Summarizes long threads and turns them into reusable notes.',
      capabilities: ['summary', 'memory', 'archive'],
      avatar_ref: null,
      description_ref: null,
      pricing_ref: null,
      auth_hint_ref: null,
    },
  ],
}

const seedContents = [
  createContentEnvelope('content://profile/identity_nova/v1', 'profile', novaProfile, now),
  createContentEnvelope('content://agent-registry/identity_nova/v1', 'agent-registry', novaRegistry, now),
  createContentEnvelope('content://auth-registry/identity_nova/v1', 'auth-registry', novaAuth, now),
  createContentEnvelope('content://profile/identity_linz/v1', 'profile', linzProfile, now),
  createContentEnvelope('content://agent-registry/identity_linz/v1', 'agent-registry', linzRegistry, now),
]

const defaultLocalAgent: AgentRecord = {
  agentId: 'agent_local_research',
  name: 'Research Copilot',
  bio: 'Local private agent for drafting, note clustering, and protocol QA.',
  description: 'Keeps unpublished prompts local and only promotes a public subset.',
  visibility: 'private',
  publishState: 'private_local',
  status: 'active',
  capabilities: ['research', 'writing'],
  pricingMode: 'free',
  updatedAt: now,
  lastPublishedAt: null,
}

function createDefaultProfileDraft(): PublicProfileDraft {
  const suffix = Math.random().toString(36).slice(2, 8) || 'local'
  const username = `vibly_${suffix}`

  return {
    version: 1,
    displayName: `Vibly User ${suffix.toUpperCase()}`,
    username,
    bio: '',
    headline: 'New Vibly profile',
    links: [],
    defaultContactPolicy: 'open' as const,
  }
}

export function createDefaultMvpState(): PersistedMvpState {
  return {
    chainState: {
      currentIdentityId: null,
      registrationState: 'not_registered',
      identitiesById: {
        identity_nova: {
          identityId: 'identity_nova',
          ownerAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          status: 'active',
          activeProfileRef: 'content://profile/identity_nova/v1',
          activeAgentRegistryRef: 'content://agent-registry/identity_nova/v1',
          activeAuthRegistryRef: 'content://auth-registry/identity_nova/v1',
          activeRelationPolicyRef: null,
        },
        identity_linz: {
          identityId: 'identity_linz',
          ownerAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstn3xS7QxU2G5LBNRzK',
          status: 'active',
          activeProfileRef: 'content://profile/identity_linz/v1',
          activeAgentRegistryRef: 'content://agent-registry/identity_linz/v1',
          activeAuthRegistryRef: null,
          activeRelationPolicyRef: null,
        },
      },
    },
    publicContentState: {
      contentsByRef: Object.fromEntries(seedContents.map((item) => [item.ref, item])),
    },
    localPrivateState: {
      wallet: {
        accounts: [],
        activeAccountId: null,
        status: 'idle',
      },
      profileDraft: createDefaultProfileDraft(),
      profilePublishState: 'draft',
      profileLastPublishedAt: null,
      agentsLocal: [defaultLocalAgent],
      relations: {},
      notifications: [],
    },
    uiState: {
      agentFilter: 'all',
      selectedLocalAgentId: defaultLocalAgent.agentId,
      selectedDiscoveryIdentityId: 'identity_nova',
      notificationCenterOpen: false,
      dismissedBannerIds: [],
    },
  }
}
