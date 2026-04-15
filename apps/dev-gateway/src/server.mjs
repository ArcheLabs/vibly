import { createHash } from 'node:crypto'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../data')
const storeFile = path.join(dataDir, 'store.json')
const port = Number(process.env.PORT ?? 8787)

mkdirSync(dataDir, { recursive: true })

const initialStore = {
  contentsByRef: {},
  identitiesById: {},
}

function loadStore() {
  if (!existsSync(storeFile)) {
    writeFileSync(storeFile, JSON.stringify(initialStore, null, 2))
    return structuredClone(initialStore)
  }

  try {
    return JSON.parse(readFileSync(storeFile, 'utf8'))
  } catch {
    return structuredClone(initialStore)
  }
}

function saveStore(store) {
  writeFileSync(storeFile, JSON.stringify(store, null, 2))
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(JSON.stringify(body))
}

function notFound(response, message = 'Not found') {
  json(response, 404, { error: message })
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

function createContent(store, kind, payload) {
  const raw = JSON.stringify(payload)
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 24)
  const contentRef = `content://${kind}/${Date.now()}-${hash}`

  store.contentsByRef[contentRef] = {
    ref: contentRef,
    kind,
    hash,
    createdAt: Date.now(),
    value: payload,
  }

  saveStore(store)

  return { contentRef, hash, ref: contentRef }
}

function aggregateIdentity(store, identityId) {
  const identity = store.identitiesById[identityId]
  if (!identity) return null

  return {
    identityId,
    status: identity.status,
    profile: identity.activeProfileRef ? store.contentsByRef[identity.activeProfileRef]?.value ?? null : null,
    activeProfileRef: identity.activeProfileRef ?? null,
    activeAgentRegistryRef: identity.activeAgentRegistryRef ?? null,
    activeAuthRegistryRef: identity.activeAuthRegistryRef ?? null,
    activeRelationPolicyRef: identity.activeRelationPolicyRef ?? null,
  }
}

function listPublicAgents(store, identityId) {
  const identity = store.identitiesById[identityId]
  if (!identity?.activeAgentRegistryRef) return []
  return store.contentsByRef[identity.activeAgentRegistryRef]?.value?.agents ?? []
}

createServer(async (request, response) => {
  if (!request.url) {
    notFound(response)
    return
  }

  if (request.method === 'OPTIONS') {
    json(response, 200, { ok: true })
    return
  }

  const store = loadStore()
  const url = new URL(request.url, `http://${request.headers.host}`)
  const pathname = url.pathname

  try {
    if (request.method === 'POST' && pathname === '/content/profile') {
      const payload = await readBody(request)
      json(response, 200, createContent(store, 'profile', payload))
      return
    }

    if (request.method === 'POST' && pathname === '/content/agent-registry') {
      const payload = await readBody(request)
      json(response, 200, createContent(store, 'agent-registry', payload))
      return
    }

    if (request.method === 'POST' && pathname === '/content/auth-registry') {
      const payload = await readBody(request)
      json(response, 200, createContent(store, 'auth-registry', payload))
      return
    }

    if (request.method === 'POST' && pathname === '/content/relation-policy') {
      const payload = await readBody(request)
      json(response, 200, createContent(store, 'relation-policy', payload))
      return
    }

    if (request.method === 'GET' && pathname.startsWith('/content/')) {
      const ref = decodeURIComponent(pathname.replace('/content/', ''))
      const content = store.contentsByRef[ref]
      if (!content) {
        notFound(response, 'Content not found')
        return
      }
      json(response, 200, content.value)
      return
    }

    if (request.method === 'GET' && pathname.startsWith('/identity/') && pathname.endsWith('/agents')) {
      const identityId = decodeURIComponent(pathname.split('/')[2] ?? '')
      json(response, 200, listPublicAgents(store, identityId))
      return
    }

    if (request.method === 'GET' && pathname.startsWith('/identity/')) {
      const identityId = decodeURIComponent(pathname.split('/')[2] ?? '')
      const aggregated = aggregateIdentity(store, identityId)
      if (!aggregated) {
        notFound(response, 'Identity not found')
        return
      }
      json(response, 200, aggregated)
      return
    }

    if (request.method === 'GET' && pathname.startsWith('/agent/')) {
      const agentId = decodeURIComponent(pathname.split('/')[2] ?? '')
      const match = Object.keys(store.identitiesById).flatMap((identityId) =>
        listPublicAgents(store, identityId).map((agent) => ({ ...agent, ownerIdentityId: identityId })),
      ).find((agent) => agent.agent_id === agentId)

      if (!match) {
        notFound(response, 'Agent not found')
        return
      }

      json(response, 200, match)
      return
    }

    if (request.method === 'GET' && pathname === '/search') {
      const query = (url.searchParams.get('q') ?? '').toLowerCase()
      const identities = Object.keys(store.identitiesById)
        .map((identityId) => aggregateIdentity(store, identityId))
        .filter(Boolean)
        .filter((identity) => {
          if (!query) return true
          const haystack = JSON.stringify(identity).toLowerCase()
          return haystack.includes(query)
        })

      const publicAgents = Object.keys(store.identitiesById)
        .flatMap((identityId) =>
          listPublicAgents(store, identityId).map((agent) => ({
            agentId: agent.agent_id,
            ownerIdentityId: identityId,
            name: agent.name,
            bio: agent.bio,
            status: agent.status,
            capabilities: agent.capabilities,
          })),
        )
        .filter((agent) => {
          if (!query) return true
          return JSON.stringify(agent).toLowerCase().includes(query)
        })

      json(response, 200, { identities, publicAgents })
      return
    }

    if (request.method === 'POST' && pathname === '/dev/register') {
      const payload = await readBody(request)
      const {
        identityId,
        ownerAddress,
        activeProfileRef = null,
        activeAgentRegistryRef = null,
        activeAuthRegistryRef = null,
        activeRelationPolicyRef = null,
      } = payload

      if (!identityId || !ownerAddress) {
        json(response, 400, { error: 'identityId and ownerAddress are required' })
        return
      }

      store.identitiesById[identityId] = {
        identityId,
        ownerAddress,
        status: 'active',
        activeProfileRef,
        activeAgentRegistryRef,
        activeAuthRegistryRef,
        activeRelationPolicyRef,
      }

      saveStore(store)
      json(response, 200, { ok: true, identity: store.identitiesById[identityId] })
      return
    }

    if (request.method === 'POST' && pathname.startsWith('/dev/pointers/')) {
      const pointerType = pathname.split('/').at(-1)
      const payload = await readBody(request)
      const { identityId, contentRef } = payload
      const identity = store.identitiesById[identityId]

      if (!identity) {
        notFound(response, 'Identity not found')
        return
      }

      if (pointerType === 'profile') identity.activeProfileRef = contentRef
      if (pointerType === 'agent-registry') identity.activeAgentRegistryRef = contentRef
      if (pointerType === 'auth-registry') identity.activeAuthRegistryRef = contentRef
      if (pointerType === 'relation-policy') identity.activeRelationPolicyRef = contentRef

      saveStore(store)
      json(response, 200, { ok: true, identity })
      return
    }

    if (request.method === 'GET' && pathname === '/health') {
      json(response, 200, { ok: true, identities: Object.keys(store.identitiesById).length })
      return
    }

    notFound(response)
  } catch (error) {
    json(response, 500, {
      error: error instanceof Error ? error.message : 'Unknown gateway error',
    })
  }
}).listen(port, () => {
  console.log(`vibly-dev-gateway listening on http://127.0.0.1:${port}`)
})

