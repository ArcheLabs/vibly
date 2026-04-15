import type { AHIPAction, AHIPActor, AHIPItem, ContentBlock, ToolIntent } from '@ahip/core'
import { makePreviewId, nowIso } from './storage'

type JsonRecord = Record<string, unknown>

const ITEM_KEYS = new Set([
  'protocol',
  'version',
  'item_id',
  'session_id',
  'conversation_id',
  'thread_id',
  'kind',
  'actor',
  'created_at',
  'updated_at',
  'reply_to',
  'correlation_id',
  'content',
  'actions',
  'approvals',
  'tool_intents',
  'widgets',
  'artifacts',
  'state_patches',
  'metadata',
  'fallback_text',
  'signature',
  'extensions',
])

const ACTION_KEYS = new Set([
  'id',
  'label',
  'kind',
  'style',
  'disabled',
  'payload',
  'fallback_text',
  'extensions',
])

const ACTION_ALIAS_KEYS = new Set([
  'action_id',
  'actionId',
  'title',
  'name',
  'type',
  'action',
  'fallbackText',
])

const TOOL_INTENT_KEYS = new Set([
  'intent_id',
  'tool_name',
  'status',
  'title',
  'description',
  'proposed_args',
  'missing_fields',
  'result_artifact_id',
  'fallback_text',
  'extensions',
])

const TOOL_INTENT_ALIAS_KEYS = new Set([
  'id',
  'intentId',
  'tool',
  'toolName',
  'name',
  'args',
  'arguments',
  'parameters',
  'missingFields',
  'resultArtifactId',
  'fallbackText',
])

const ACTOR_KINDS = new Set(['human', 'agent', 'system', 'tool', 'host'])

const TOOL_INTENT_STATUSES = new Set([
  'proposed',
  'awaiting_approval',
  'awaiting_user_input',
  'ready',
  'running',
  'completed',
  'failed',
])

const CORE_BLOCK_TYPES = new Set([
  'text',
  'markdown',
  'image',
  'file',
  'code',
  'quote',
  'divider',
  'badge',
  'stat',
  'table',
  'chart',
  'entity_card',
  'form',
  'status',
  'error',
  'payment_request',
  'payment_receipt',
])

const WIDGET_KEYS = new Set([
  'id',
  'widget_id',
  'widget_type',
  'props',
  'permissions',
  'fallback_text',
  'extensions',
])

const WIDGET_PERMISSION_KEYS = new Set([
  'network',
  'clipboard',
  'wallet',
  'storage',
  'extensions',
])

const CORE_ENTITY_KINDS = new Set(['user', 'agent', 'twin', 'dao', 'asset'])

const EXTENSION_IDENTIFIER_PATTERN =
  /^[a-z0-9]+(?:[.-][a-z0-9]+)*(?:\.[a-z0-9]+(?:[.-][a-z0-9]+)*)*\/[a-z0-9][a-z0-9._-]*$/

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function recordValue(value: unknown) {
  return isRecord(value) ? value : undefined
}

function slugIdentifier(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/_+/g, '_')
    .replace(/_+$/g, '')

  return slug || 'model'
}

function isExtensionIdentifier(value: string) {
  return EXTENSION_IDENTIFIER_PATTERN.test(value)
}

function normalizeBlockType(value: unknown) {
  const rawText = stringValue(value)?.toLowerCase()
  if (rawText && isExtensionIdentifier(rawText)) return rawText

  const raw = slugIdentifier(rawText ?? 'text')
  const aliases: Record<string, string> = {
    md: 'markdown',
    entity: 'entity_card',
    'entity-card': 'entity_card',
    entitycard: 'entity_card',
    entity_card_block: 'entity_card',
    card: 'entity_card',
    status_block: 'status',
    progress: 'status',
    table_block: 'table',
    chart_block: 'chart',
    form_block: 'form',
    error_block: 'error',
  }
  const type = aliases[raw] ?? raw

  if (CORE_BLOCK_TYPES.has(type) || isExtensionIdentifier(type)) return type
  return `dev.vibly/${type}_block`
}

function normalizeEntityKind(value: unknown) {
  const rawText = stringValue(value)?.toLowerCase()
  if (rawText && isExtensionIdentifier(rawText)) return rawText

  const raw = slugIdentifier(rawText ?? 'model_entity')

  if (CORE_ENTITY_KINDS.has(raw)) return raw
  return `dev.vibly/${raw}`
}

function getBlockText(block: JsonRecord) {
  return (
    stringValue(block.text) ??
    stringValue(block.markdown) ??
    stringValue(block.content) ??
    stringValue(block.message) ??
    stringValue(block.description) ??
    stringValue(block.title)
  )
}

function normalizeActorKind(value: unknown): AHIPActor['actor_kind'] {
  const raw = stringValue(value)?.toLowerCase()
  if (!raw) return 'agent'
  if (raw === 'assistant' || raw === 'ai' || raw === 'model') return 'agent'
  if (raw === 'user') return 'human'
  if (ACTOR_KINDS.has(raw)) return raw as AHIPActor['actor_kind']
  return 'agent'
}

function sanitizeActor(value: unknown): AHIPActor {
  const actor = recordValue(value) ?? {}
  const actorId =
    stringValue(actor.actor_id) ??
    stringValue(actor.actorId) ??
    stringValue(actor.id) ??
    stringValue(actor.principal_id) ??
    stringValue(actor.name) ??
    'agent_ahip_model'
  const displayName =
    stringValue(actor.display_name) ??
    stringValue(actor.displayName) ??
    stringValue(actor.name)

  return {
    actor_id: actorId,
    actor_kind: normalizeActorKind(actor.actor_kind ?? actor.actorKind ?? actor.kind ?? actor.type ?? actor.role),
    ...(displayName ? { display_name: displayName } : {}),
    ...(stringValue(actor.avatar_url) ? { avatar_url: stringValue(actor.avatar_url) } : {}),
    ...(stringValue(actor.principal_id) ? { principal_id: stringValue(actor.principal_id) } : {}),
    ...(recordValue(actor.extensions) ? { extensions: actor.extensions as Record<string, unknown> } : {}),
  }
}

function extraActionPayload(action: JsonRecord) {
  const extra: JsonRecord = {}

  for (const [key, value] of Object.entries(action)) {
    if (ACTION_KEYS.has(key) || ACTION_ALIAS_KEYS.has(key)) continue
    extra[key] = value
  }

  return Object.keys(extra).length ? extra : undefined
}

function sanitizeAction(value: unknown, index: number): AHIPAction {
  const action = recordValue(value) ?? {}
  const payload = recordValue(action.payload)
  const extraPayload = extraActionPayload(action)
  const mergedPayload = payload || extraPayload
    ? {
        ...(extraPayload ?? {}),
        ...(payload ?? {}),
      }
    : undefined

  return {
    id:
      stringValue(action.id) ??
      stringValue(action.action_id) ??
      stringValue(action.actionId) ??
      makePreviewId(`action_${index}`),
    label:
      stringValue(action.label) ??
      stringValue(action.title) ??
      stringValue(action.name) ??
      'Continue',
    kind:
      stringValue(action.kind) ??
      stringValue(action.type) ??
      stringValue(action.action) ??
      'continue_task',
    ...(action.style === 'primary' || action.style === 'secondary' || action.style === 'danger'
      ? { style: action.style }
      : {}),
    ...(typeof action.disabled === 'boolean' ? { disabled: action.disabled } : {}),
    ...(mergedPayload ? { payload: mergedPayload } : {}),
    ...(stringValue(action.fallback_text) || stringValue(action.fallbackText)
      ? { fallback_text: stringValue(action.fallback_text) ?? stringValue(action.fallbackText) }
      : {}),
    ...(recordValue(action.extensions) ? { extensions: action.extensions as Record<string, unknown> } : {}),
  }
}

function normalizeStatus(value: unknown) {
  const status = stringValue(value)?.toLowerCase()
  if (status === 'idle' || status === 'running' || status === 'waiting' || status === 'done' || status === 'failed') {
    return status
  }
  if (status === 'success' || status === 'complete' || status === 'completed') return 'done'
  if (status === 'error') return 'failed'
  return 'waiting'
}

function normalizeToolIntentStatus(value: unknown): ToolIntent['status'] {
  const status = stringValue(value)?.toLowerCase()
  if (status && TOOL_INTENT_STATUSES.has(status)) return status as ToolIntent['status']
  if (status === 'waiting') return 'awaiting_user_input'
  if (status === 'done' || status === 'success') return 'completed'
  if (status === 'error') return 'failed'
  return 'proposed'
}

function extraToolIntentArgs(intent: JsonRecord) {
  const extra: JsonRecord = {}

  for (const [key, value] of Object.entries(intent)) {
    if (TOOL_INTENT_KEYS.has(key) || TOOL_INTENT_ALIAS_KEYS.has(key)) continue
    extra[key] = value
  }

  return Object.keys(extra).length ? extra : undefined
}

function sanitizeToolIntent(value: unknown, index: number): ToolIntent {
  const intent = recordValue(value) ?? {}
  const proposedArgs =
    recordValue(intent.proposed_args) ??
    recordValue(intent.args) ??
    recordValue(intent.arguments) ??
    recordValue(intent.parameters)
  const extraArgs = extraToolIntentArgs(intent)
  const mergedProposedArgs = proposedArgs || extraArgs
    ? {
        ...(extraArgs ?? {}),
        ...(proposedArgs ?? {}),
      }
    : undefined
  const missingFields = Array.isArray(intent.missing_fields)
    ? intent.missing_fields
    : Array.isArray(intent.missingFields)
      ? intent.missingFields
      : undefined

  return {
    intent_id:
      stringValue(intent.intent_id) ??
      stringValue(intent.intentId) ??
      stringValue(intent.id) ??
      makePreviewId(`tool_intent_${index}`),
    tool_name:
      stringValue(intent.tool_name) ??
      stringValue(intent.toolName) ??
      stringValue(intent.tool) ??
      stringValue(intent.name) ??
      'model_tool_intent',
    status: normalizeToolIntentStatus(intent.status),
    ...(stringValue(intent.title) ? { title: stringValue(intent.title) } : {}),
    ...(stringValue(intent.description) ? { description: stringValue(intent.description) } : {}),
    ...(mergedProposedArgs ? { proposed_args: mergedProposedArgs } : {}),
    ...(missingFields ? { missing_fields: missingFields.map((field) => String(field)) } : {}),
    ...(stringValue(intent.result_artifact_id) ?? stringValue(intent.resultArtifactId)
      ? { result_artifact_id: stringValue(intent.result_artifact_id) ?? stringValue(intent.resultArtifactId) }
      : {}),
    ...(stringValue(intent.fallback_text) ?? stringValue(intent.fallbackText)
      ? { fallback_text: stringValue(intent.fallback_text) ?? stringValue(intent.fallbackText) }
      : {}),
    ...(recordValue(intent.extensions) ? { extensions: intent.extensions as Record<string, unknown> } : {}),
  }
}

function sanitizeWidgetPermissions(value: unknown): Record<string, unknown> | undefined {
  const perms = recordValue(value)
  if (!perms) return undefined

  const sanitized: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(perms)) {
    if (!WIDGET_PERMISSION_KEYS.has(key)) continue
    if (key === 'network') {
      sanitized.network = val === 'limited' ? 'limited' : 'none'
    } else if (key === 'clipboard' || key === 'wallet') {
      sanitized[key] = typeof val === 'boolean' ? val : false
    } else if (key === 'storage') {
      sanitized.storage = val === 'session' ? 'session' : 'none'
    } else if (key === 'extensions' && isRecord(val)) {
      sanitized.extensions = val
    }
  }

  return Object.keys(sanitized).length ? sanitized : undefined
}

function sanitizeWidget(value: unknown, index: number): Record<string, unknown> {
  const widget = recordValue(value) ?? {}
  const widgetId =
    stringValue(widget.widget_id) ??
    stringValue(widget.widgetId) ??
    stringValue(widget.id) ??
    makePreviewId(`widget_${index}`)
  const widgetType =
    stringValue(widget.widget_type) ??
    stringValue(widget.widgetType) ??
    stringValue(widget.type) ??
    'dev.vibly/unknown_widget'
  const props = recordValue(widget.props) ?? {}
  const permissions = sanitizeWidgetPermissions(widget.permissions)

  return {
    id: stringValue(widget.id) ?? makePreviewId(`widget_${index}`),
    widget_id: widgetId,
    widget_type: widgetType,
    props,
    ...(permissions ? { permissions } : {}),
    ...(stringValue(widget.fallback_text) ?? stringValue(widget.fallbackText)
      ? { fallback_text: stringValue(widget.fallback_text) ?? stringValue(widget.fallbackText) }
      : {}),
    ...(recordValue(widget.extensions) ? { extensions: widget.extensions as Record<string, unknown> } : {}),
  }
}

function sanitizeBlock(value: unknown, index: number): ContentBlock | unknown {
  const block = recordValue(value)
  if (!block) return value

  const type = normalizeBlockType(block.type ?? block.block_type ?? block.blockType ?? block.kind)
  const base = {
    id: stringValue(block.id) ?? makePreviewId(`block_${index}`),
    type,
    ...(stringValue(block.title) ? { title: stringValue(block.title) } : {}),
    ...(stringValue(block.caption) ? { caption: stringValue(block.caption) } : {}),
    ...(stringValue(block.fallback_text) ?? stringValue(block.fallbackText)
      ? { fallback_text: stringValue(block.fallback_text) ?? stringValue(block.fallbackText) }
      : {}),
  }

  if (type === 'status') {
    return {
      ...base,
      type: 'status',
      status: normalizeStatus(block.status),
      ...(stringValue(block.message) ?? stringValue(block.description)
        ? { message: stringValue(block.message) ?? stringValue(block.description) }
        : {}),
    }
  }

  if (type === 'entity_card') {
    const name = stringValue(block.name) ?? stringValue(block.title) ?? 'Entity'
    return {
      ...base,
      type: 'entity_card',
      entity_kind: normalizeEntityKind(block.entity_kind ?? block.entityKind ?? block.kind),
      entity_id:
        stringValue(block.entity_id) ??
        stringValue(block.entityId) ??
        name.toLowerCase().replace(/[^a-z0-9]+/gi, '_'),
      name,
      ...(stringValue(block.subtitle) ? { subtitle: stringValue(block.subtitle) } : {}),
      ...(Array.isArray(block.fields) ? { fields: block.fields } : {}),
    }
  }

  if (type === 'text') {
    return {
      ...base,
      type: 'text',
      text: getBlockText(block) ?? 'Text',
    }
  }

  if (type === 'markdown') {
    return {
      ...base,
      type: 'markdown',
      markdown: getBlockText(block) ?? '',
    }
  }

  if (!CORE_BLOCK_TYPES.has(type)) {
    return {
      ...base,
      type,
      fallback_text: stringValue(block.fallback_text) ?? stringValue(block.fallbackText) ?? getBlockText(block) ?? 'Unsupported AHIP block.',
      data: block,
    }
  }

  return {
    ...block,
    id: stringValue(block.id) ?? makePreviewId(`block_${index}`),
    type,
  }
}

export function sanitizeModelAHIPItem(input: unknown, sessionId: string): unknown {
  if (!isRecord(input)) return input

  const item: JsonRecord = {}

  for (const [key, value] of Object.entries(input)) {
    if (ITEM_KEYS.has(key)) item[key] = value
  }

  item.protocol = 'ahip'
  item.version = '0.2'
  item.item_id = stringValue(item.item_id) ?? stringValue(input.itemId) ?? stringValue(input.id) ?? makePreviewId('ahip')
  item.session_id = stringValue(item.session_id) ?? sessionId
  item.kind = stringValue(item.kind) ?? 'turn'
  item.actor = sanitizeActor(item.actor)
  item.created_at = stringValue(item.created_at) ?? stringValue(input.createdAt) ?? nowIso()
  item.fallback_text =
    stringValue(item.fallback_text) ??
    stringValue(input.fallbackText) ??
    stringValue(input.text) ??
    'AHIP item fallback.'

  if (!Array.isArray(item.content) && Array.isArray(input.blocks)) {
    item.content = input.blocks
  }

  // Pre-pass: extract misplaced tool_intents & inline actions from raw content
  // BEFORE block sanitization strips them
  if (Array.isArray(item.content)) {
    const rawContent = item.content as unknown[]
    const cleanRawContent: unknown[] = []
    const extractedIntents: ToolIntent[] = []
    const extractedActions: AHIPAction[] = []
    let intentExtractIndex = Array.isArray(item.tool_intents) ? (item.tool_intents as unknown[]).length : 0
    let actionExtractIndex = Array.isArray(item.actions) ? (item.actions as unknown[]).length : 0

    for (const rawBlock of rawContent) {
      if (!isRecord(rawBlock)) {
        cleanRawContent.push(rawBlock)
        continue
      }

      const rawType = stringValue(rawBlock.type)?.toLowerCase() ?? ''
      const rawKind = stringValue(rawBlock.kind)?.toLowerCase() ?? ''

      // Detect tool_intent in content
      const isToolIntentBlock =
        rawType === 'tool_intent' ||
        rawKind === 'tool_intent' ||
        (isRecord(rawBlock) && (stringValue(rawBlock.tool_name) || stringValue(rawBlock.intent_id)) && !CORE_BLOCK_TYPES.has(rawType))

      if (isToolIntentBlock) {
        extractedIntents.push(sanitizeToolIntent(rawBlock, intentExtractIndex++))
        continue
      }

      // Extract actions[] nested inside content blocks
      if (Array.isArray(rawBlock.actions)) {
        for (const action of rawBlock.actions as unknown[]) {
          extractedActions.push(sanitizeAction(action, actionExtractIndex++))
        }
      }

      cleanRawContent.push(rawBlock)
    }

    if (extractedIntents.length > 0) {
      item.content = cleanRawContent
      item.tool_intents = [
        ...((item.tool_intents as ToolIntent[]) ?? []),
        ...extractedIntents,
      ]
    }

    if (extractedActions.length > 0) {
      item.actions = [
        ...((item.actions as AHIPAction[]) ?? []),
        ...extractedActions,
      ]
    }
  }

  // Now sanitize blocks/intents/actions
  if (Array.isArray(item.content)) {
    item.content = (item.content as unknown[]).map((block, index) => sanitizeBlock(block, index))
  }

  if (Array.isArray(item.tool_intents)) {
    item.tool_intents = (item.tool_intents as unknown[]).map((intent, index) => sanitizeToolIntent(intent, index))
  }

  if (Array.isArray(item.actions)) {
    item.actions = (item.actions as unknown[]).map((action, index) => sanitizeAction(action, index))
  }

  if (Array.isArray(item.widgets)) {
    item.widgets = (item.widgets as unknown[]).map((widget, index) => sanitizeWidget(widget, index))
  }

  return item
}
