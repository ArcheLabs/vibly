import {
  assertValidAHIPItem,
  type AHIPActor,
  type AHIPItem,
  type ContentBlock,
  type PaymentRequestBlock,
  type StatePatch,
} from '@ahip/core'
import { makePreviewId, nowIso } from './storage'
import type {
  AhipModelDecision,
  AhipProtocolScenario,
  AhipScenarioFixture,
  AhipScenarioActionContext,
} from './types'

export const AHIP_PREVIEW_SCENARIO_EXTENSION_KEY = 'dev.vibly/scenario_id'

type Stone = 'black' | 'white' | null
type GomokuBoard = Stone[][]

const PREVIEW_AGENT_ACTOR: AHIPActor = {
  actor_id: 'agent_ahip_preview',
  actor_kind: 'agent',
  display_name: 'AHIP Preview Agent',
}

const PREVIEW_HOST_ACTOR: AHIPActor = {
  actor_id: 'host_ahip_preview',
  actor_kind: 'host',
  display_name: 'AHIP Host',
}

function withScenarioMetadata(item: AHIPItem, scenarioId: string): AHIPItem {
  return {
    ...item,
    metadata: {
      ...item.metadata,
      tags: [...(item.metadata?.tags ?? []), `scenario:${scenarioId}`],
      extensions: {
        ...item.metadata?.extensions,
        [AHIP_PREVIEW_SCENARIO_EXTENSION_KEY]: scenarioId,
      },
    },
  }
}

export function getScenarioIdFromItem(item: AHIPItem) {
  const scenarioId = item.metadata?.extensions?.[AHIP_PREVIEW_SCENARIO_EXTENSION_KEY]
  return typeof scenarioId === 'string' ? scenarioId : undefined
}

export function inferScenarioIdFromItem(item: AHIPItem) {
  const scenarioId = getScenarioIdFromItem(item)
  if (scenarioId) return scenarioId
  if (item.widgets?.some((widget) => widget.widget_type === 'dev.vibly/gomoku_board')) {
    return 'gomoku_widget'
  }
  return undefined
}

function baseItem(
  sessionId: string,
  scenarioId: string,
  fallbackText: string,
  kind: AHIPItem['kind'] = 'turn',
  actor: AHIPActor = PREVIEW_AGENT_ACTOR,
): Pick<
  AHIPItem,
  'protocol' | 'version' | 'item_id' | 'session_id' | 'kind' | 'actor' | 'created_at' | 'fallback_text' | 'metadata'
> {
  return {
    protocol: 'ahip',
    version: '0.2',
    item_id: makePreviewId('ahip'),
    session_id: sessionId,
    kind,
    actor,
    created_at: nowIso(),
    fallback_text: fallbackText,
    metadata: {
      tags: [`scenario:${scenarioId}`],
      extensions: {
        [AHIP_PREVIEW_SCENARIO_EXTENSION_KEY]: scenarioId,
      },
    },
  }
}

function validItem(item: AHIPItem, scenarioId: string): AHIPItem {
  return assertValidAHIPItem(withScenarioMetadata(item, scenarioId))
}

function createTextItem(sessionId: string, scenarioId: string, text: string): AHIPItem {
  return validItem({
    ...baseItem(sessionId, scenarioId, text),
    content: [
      {
        id: makePreviewId('block'),
        type: 'text',
        text,
      },
    ],
  }, scenarioId)
}

function createMarkdownItem(sessionId: string): AHIPItem {
  const scenarioId = 'markdown'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'Markdown AHIP response preview.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'markdown',
        title: 'AHIP markdown',
        markdown:
          '### AHIP markdown\n\nUse markdown when the response benefits from structure, but does not need a custom widget.',
      },
      {
        id: makePreviewId('block'),
        type: 'quote',
        text: 'Render structure only when it clarifies the next user action.',
        attribution: 'AHIP Skill',
      },
    ],
  }, scenarioId)
}

function createFormItem(sessionId: string): AHIPItem {
  const scenarioId = 'form'
  const formId = makePreviewId('form')

  return validItem({
    ...baseItem(sessionId, scenarioId, 'A structured form is ready.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'form',
        title: 'Quick setup',
        form_id: formId,
        submit_action_id: 'submit_setup_form',
        fields: [
          { kind: 'text', key: 'name', label: 'Name', required: true, placeholder: 'Your name' },
          {
            kind: 'select',
            key: 'priority',
            label: 'Priority',
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Normal', value: 'normal' },
              { label: 'High', value: 'high' },
            ],
            default_value: 'normal',
          },
          { kind: 'textarea', key: 'notes', label: 'Notes', placeholder: 'Anything else?' },
        ],
      },
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'waiting',
        message: 'Waiting for user input.',
      },
    ],
    actions: [
      {
        id: 'submit_setup_form',
        label: 'Submit',
        kind: 'submit_form',
        style: 'primary',
        payload: { form_id: formId },
      },
      {
        id: 'continue_text_only',
        label: 'Continue in text',
        kind: 'continue_task',
      },
    ],
  }, scenarioId)
}

function createTableItem(sessionId: string): AHIPItem {
  const scenarioId = 'table'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'A structured comparison table is ready.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'table',
        title: 'Preview comparison',
        columns: [
          { key: 'option', title: 'Option', data_type: 'text' },
          { key: 'fit', title: 'Fit', data_type: 'badge' },
          { key: 'note', title: 'Note', data_type: 'text' },
        ],
        rows: [
          { option: 'Plain text', fit: { kind: 'badge', label: 'Low', tone: 'warning' }, note: 'Good for simple answers.' },
          { option: 'AHIP item', fit: { kind: 'badge', label: 'High', tone: 'success' }, note: 'Best for structured, actionable state.' },
          { option: 'Widget', fit: { kind: 'badge', label: 'Contextual', tone: 'info' }, note: 'Use only when host supports it.' },
        ],
      },
    ],
  }, scenarioId)
}

function createChartItem(sessionId: string): AHIPItem {
  const scenarioId = 'chart'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'A chart preview is ready.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'chart',
        title: 'Weekly preview usage',
        spec: {
          kind: 'bar',
          data: [
            { day: 'Mon', count: 4 },
            { day: 'Tue', count: 7 },
            { day: 'Wed', count: 6 },
            { day: 'Thu', count: 10 },
          ],
          x: { field: 'day', type: 'ordinal', title: 'Day' },
          y: { field: 'count', type: 'quantitative', title: 'Sessions' },
          options: { show_axis: true, show_grid: true },
        },
      },
    ],
  }, scenarioId)
}

function createEntityCardItem(sessionId: string): AHIPItem {
  const scenarioId = 'entity_card'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'An entity card preview is ready.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'entity_card',
        entity_kind: 'agent',
        entity_id: 'agent_ahip_preview',
        name: 'AHIP Preview Agent',
        subtitle: 'Browser-only protocol preview',
        fields: [
          { label: 'Runtime', value: 'LangGraph or local demo' },
          { label: 'Protocol', value: 'AHIP v0.2' },
        ],
      },
    ],
  }, scenarioId)
}

function createStatusItem(sessionId: string): AHIPItem {
  const scenarioId = 'status'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'Task status preview.'),
    content: [
      { id: makePreviewId('block'), type: 'status', title: 'Task status', status: 'running', message: 'Preparing the preview task.' },
      { id: makePreviewId('block'), type: 'stat', label: 'Progress', value: 65, unit: '%' },
    ],
    actions: [
      { id: 'continue_status_task', label: 'Continue task', kind: 'continue_task', style: 'primary' },
      { id: 'retry_status_task', label: 'Retry', kind: 'retry' },
    ],
  }, scenarioId)
}

function createErrorPreviewItem(sessionId: string): AHIPItem {
  const scenarioId = 'error'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'Recoverable error preview.'),
    kind: 'system_notice',
    actor: PREVIEW_HOST_ACTOR,
    content: [
      {
        id: makePreviewId('block'),
        type: 'error',
        title: 'Recoverable preview error',
        code: 'AHIP_PREVIEW_RECOVERABLE',
        message: 'The preview hit a recoverable local error.',
        recoverable: true,
      },
    ],
    actions: [
      { id: 'retry_error_preview', label: 'Retry', kind: 'retry', style: 'primary' },
      { id: 'continue_after_error', label: 'Continue', kind: 'continue_task' },
    ],
  }, scenarioId)
}

function createApprovalItem(sessionId: string): AHIPItem {
  const scenarioId = 'approval'
  const approvalId = makePreviewId('approval')

  return validItem({
    ...baseItem(sessionId, scenarioId, 'Approval is required before continuing.', 'approval_request'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        title: 'Approval required',
        status: 'waiting',
        message: 'Review the request and choose an action.',
      },
    ],
    approvals: [
      {
        approval_id: approvalId,
        kind: 'request',
        scope: 'tool_execution',
        title: 'Continue with the proposed action',
        description: 'This is a local preview approval. No external action will be executed.',
        risk_level: 'low',
        payload: { preview: true },
      },
    ],
    actions: [
      { id: 'approve_preview', label: 'Approve', kind: 'approve', style: 'primary', payload: { approval_id: approvalId } },
      { id: 'reject_preview', label: 'Reject', kind: 'reject', style: 'secondary', payload: { approval_id: approvalId } },
    ],
  }, scenarioId)
}

function createPaymentItem(sessionId: string): AHIPItem {
  const scenarioId = 'payment'
  const approvalId = makePreviewId('approval')
  const paymentIntentId = makePreviewId('payment')

  return validItem({
    ...baseItem(sessionId, scenarioId, 'A payment request preview is ready.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'payment_request',
        title: 'Payment request',
        payment_scheme: 'preview',
        payment_intent_id: paymentIntentId,
        amount: '1.00',
        asset: 'VER',
        receiver: 'identity_preview_receiver',
        memo: 'Local AHIP payment preview only',
        status: 'pending',
      },
    ],
    approvals: [
      {
        approval_id: approvalId,
        kind: 'request',
        scope: 'payment',
        title: 'Approve payment preview',
        description: 'No chain transaction will be sent in phase one.',
        risk_level: 'medium',
        payload: { payment_intent_id: paymentIntentId },
      },
    ],
    actions: [
      {
        id: 'approve_payment_preview',
        label: 'Approve preview',
        kind: 'initiate_payment',
        style: 'primary',
        payload: { approval_id: approvalId, payment_intent_id: paymentIntentId },
      },
      { id: 'reject_payment_preview', label: 'Reject', kind: 'reject', payload: { approval_id: approvalId } },
    ],
  }, scenarioId)
}

function createToolIntentItem(sessionId: string): AHIPItem {
  const scenarioId = 'tool_intent'
  const intentId = makePreviewId('intent')

  return validItem({
    ...baseItem(sessionId, scenarioId, 'A tool intent preview is ready.'),
    tool_intents: [
      {
        intent_id: intentId,
        tool_name: 'preview.search_docs',
        status: 'awaiting_approval',
        title: 'Search local docs',
        description: 'Preview a tool intent without making an external request.',
        proposed_args: { query: 'AHIP v0.2 renderer flow' },
        fallback_text: 'Tool intent: search local docs for AHIP v0.2 renderer flow.',
      },
    ],
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'waiting',
        message: 'Tool execution is waiting for host dispatch.',
      },
    ],
    actions: [
      { id: 'invoke_preview_tool', label: 'Run preview tool', kind: 'invoke_tool', style: 'primary', payload: { intent_id: intentId } },
      { id: 'retry_preview_tool', label: 'Retry', kind: 'retry', payload: { intent_id: intentId } },
    ],
  }, scenarioId)
}

function createToolResultItem(sessionId: string): AHIPItem {
  const scenarioId = 'tool_result'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'Tool result preview is complete.', 'tool_result', PREVIEW_HOST_ACTOR),
    content: [
      { id: makePreviewId('block'), type: 'status', status: 'done', message: 'Preview tool completed locally.' },
      { id: makePreviewId('block'), type: 'markdown', markdown: '- Result one\n- Result two\n- Result three' },
    ],
    tool_intents: [
      {
        intent_id: makePreviewId('intent'),
        tool_name: 'preview.search_docs',
        status: 'completed',
        title: 'Search local docs',
        description: 'The local preview tool returned sample results.',
      },
    ],
  }, scenarioId)
}

function createArtifactItem(sessionId: string): AHIPItem {
  const scenarioId = 'artifact'
  const artifactId = makePreviewId('artifact')

  return validItem({
    ...baseItem(sessionId, scenarioId, 'An artifact announcement preview is ready.', 'artifact_announcement'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'markdown',
        markdown: 'A preview report artifact is available. Opening it records a host event.',
      },
    ],
    artifacts: [
      {
        artifact_id: artifactId,
        kind: 'report',
        name: 'AHIP preview report',
        uri: 'https://example.com/ahip-preview-report',
        mime_type: 'text/html',
        summary: 'Local preview artifact used to verify artifact open events.',
        fallback_text: 'AHIP preview report artifact.',
      },
    ],
    actions: [
      {
        id: 'open_preview_artifact',
        label: 'Open artifact',
        kind: 'open_artifact',
        payload: { artifact_id: artifactId },
      },
    ],
  }, scenarioId)
}

function createStatePatchItem(sessionId: string): AHIPItem {
  const scenarioId = 'state_patch'
  const patch: StatePatch = {
    patch_id: makePreviewId('patch'),
    target: 'preview.session',
    op: 'merge',
    path: '/settings',
    value: {
      theme: 'protocol-preview',
      updated_by: 'ahip_state_patch',
    },
  }

  return validItem({
    ...baseItem(sessionId, scenarioId, 'A state patch preview is ready.', 'state_patch', PREVIEW_HOST_ACTOR),
    content: [
      { id: makePreviewId('block'), type: 'status', status: 'done', message: 'State patch generated for preview session.' },
    ],
    state_patches: [patch],
  }, scenarioId)
}

function createUnsupportedFallbackItem(sessionId: string): AHIPItem {
  const scenarioId = 'unsupported_fallback'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'Unsupported UI fallback preview.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'dev.vibly/unsupported_panel',
        title: 'Unsupported custom block',
        fallback_text: 'Fallback: this custom block is not registered by the host.',
        data: {
          secret: '[redacted]',
          note: 'The host should show fallback text.',
        },
      } satisfies ContentBlock,
    ],
    widgets: [
      {
        id: makePreviewId('widget'),
        widget_id: 'unsupported-widget-preview',
        widget_type: 'dev.vibly/unsupported_widget',
        props: {
          label: 'Unsupported widget',
        },
        fallback_text: 'Fallback: this widget type is not registered by the host.',
      },
    ],
  }, scenarioId)
}

function emptyBoard(): GomokuBoard {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null as Stone))
}

function createGomokuItem(sessionId: string, board = emptyBoard(), note = 'Your turn.'): AHIPItem {
  const scenarioId = 'gomoku_widget'
  return validItem({
    ...baseItem(sessionId, scenarioId, 'Gomoku board preview.'),
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        title: 'Stateful interaction',
        status: 'waiting',
        message: note,
      },
    ],
    widgets: [
      {
        id: makePreviewId('widget'),
        widget_id: 'gomoku-preview',
        widget_type: 'dev.vibly/gomoku_board',
        props: {
          board,
          humanStone: 'black',
          agentStone: 'white',
          note,
        },
        fallback_text: 'Gomoku board: use an AHIP-capable host to place stones.',
      },
    ],
    actions: [
      {
        id: 'restart_gomoku',
        label: 'Restart',
        kind: 'invoke_widget_action',
        payload: { widget_id: 'gomoku-preview', action: 'restart' },
      },
      {
        id: 'continue_gomoku_text',
        label: 'Explain position',
        kind: 'continue_task',
      },
    ],
  }, scenarioId)
}

function isAppletContinuationPrompt(userText: string) {
  return /The user selected AHIP action|requested_applet|capability-safe fallback|matching_widget_type|applet_renderer/i.test(userText)
}

function requestedAppletName(userText: string) {
  const requestedApplet = userText.match(/"requested_applet"\s*:\s*"([^"]+)"/i)?.[1]
  if (requestedApplet) return requestedApplet
  return boardGameName(userText)
}

function createBoardIntentItem(sessionId: string, gameName: string, terminal = false): AHIPItem {
  const scenarioId = 'board_fallback'
  return validItem({
    ...baseItem(
      sessionId,
      scenarioId,
      terminal
        ? `${gameName} cannot continue without a matching applet renderer.`
        : `${gameName} needs a stateful AHIP interaction.`,
    ),
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        title: 'Stateful applet proposal',
        status: terminal ? 'failed' : 'waiting',
        message:
          terminal
            ? `The host still has no matching ${gameName} applet renderer. The Preview has preserved the request as AHIP, but cannot advance the interaction without a registered applet/widget or a successful LLM continuation.`
            : `I should render ${gameName} as an AHIP interaction, but this host has not registered a dedicated ${gameName} widget yet.`,
      },
      {
        id: makePreviewId('block'),
        type: 'entity_card',
        entity_kind: 'dev.vibly/board_game',
        entity_id: gameName.toLowerCase().replace(/\s+/g, '_'),
        name: gameName,
        subtitle: 'AHIP widget/app registration needed',
        fields: [
          { label: 'Decision', value: 'Render AHIP instead of plain text' },
          {
            label: 'Next step',
            value: terminal
              ? 'Register a matching applet/widget or retry with a working provider'
              : 'Continue with a text-based interactive experience or register a matching applet/widget',
          },
        ],
      },
    ],
    tool_intents: [
      {
        intent_id: makePreviewId('intent'),
        tool_name: 'render_stateful_applet',
        status: terminal ? 'failed' : 'awaiting_user_input',
        title: `${gameName} applet renderer`,
        description:
          terminal
            ? 'The applet continuation stopped because no matching renderer is registered and the provider fallback cannot safely invent one.'
            : 'The AHIP skill recognized a durable stateful interaction. The host should provide a matching applet/widget before full interactive play.',
        missing_fields: ['matching_widget_type', 'applet_renderer'],
        proposed_args: {
          requested_applet: gameName,
          required_capabilities: ['stateful_interaction', 'action_dispatch', 'state_patches'],
        },
      },
    ],
    actions: terminal
      ? []
      : [
          {
            id: 'generate_applet',
            label: 'Generate applet',
            kind: 'invoke_tool',
            style: 'primary',
            payload: {
              tool_name: 'render_stateful_applet',
              requested_applet: gameName,
            },
            fallback_text: `Generate a ${gameName} applet dynamically.`,
          },
          {
            id: 'continue_board_text',
            label: 'Play with text-based board',
            kind: 'continue_task',
            style: 'secondary',
            payload: {
              requested_applet: gameName,
              instruction:
                'Generate a playable text-based experience for this game using markdown blocks for the board, form or action buttons for moves, and status blocks for game state. Do NOT re-propose the same tool_intent.',
            },
          },
        ],
  }, scenarioId)
}

function createActionPatch(actionContext: AhipScenarioActionContext): StatePatch {
  return {
    patch_id: makePreviewId('patch'),
    target: 'action',
    op: 'set',
    path: `/${actionContext.action.id}`,
    value: {
      kind: actionContext.action.kind,
      label: actionContext.action.label,
      payload: actionContext.action.payload ?? {},
      handled_at: nowIso(),
    },
  }
}

function createGenericActionResult(context: AhipScenarioActionContext, scenarioId = getScenarioIdFromItem(context.item) ?? 'action_result') {
  return validItem({
    ...baseItem(context.sessionId, scenarioId, `Action handled: ${context.action.label}`, 'tool_result', PREVIEW_HOST_ACTOR),
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'done',
        message: `Action handled locally: ${context.action.label}`,
      },
    ],
    state_patches: [createActionPatch(context)],
  }, scenarioId)
}

function createApprovalResponse(context: AhipScenarioActionContext) {
  const scenarioId = 'approval'
  const approvalId = typeof context.action.payload?.approval_id === 'string'
    ? context.action.payload.approval_id
    : context.item.approvals?.[0]?.approval_id ?? makePreviewId('approval')
  const approved = context.action.kind === 'approve'

  return validItem({
    ...baseItem(context.sessionId, scenarioId, approved ? 'Approval accepted.' : 'Approval rejected.', 'approval_response', PREVIEW_HOST_ACTOR),
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status: approved ? 'done' : 'failed',
        message: approved ? 'The preview approval was accepted.' : 'The preview approval was rejected.',
      },
    ],
    approvals: [
      {
        approval_id: approvalId,
        kind: 'response',
        response: approved ? 'approved' : 'rejected',
        responded_at: nowIso(),
      },
    ],
    state_patches: [createActionPatch(context)],
  }, scenarioId)
}

function createPaymentReceipt(context: AhipScenarioActionContext) {
  const scenarioId = 'payment'
  const paymentRequest = context.item.content?.find(
    (block): block is PaymentRequestBlock => block.type === 'payment_request',
  ) ?? null

  return validItem({
    ...baseItem(context.sessionId, scenarioId, 'Payment receipt generated for local preview.', 'tool_result', PREVIEW_HOST_ACTOR),
    content: [
      {
        id: makePreviewId('block'),
        type: 'payment_receipt',
        title: 'Payment receipt',
        payment_scheme: 'preview',
        tx_hash: makePreviewId('preview_tx'),
        amount: paymentRequest?.amount ?? '1.00',
        asset: paymentRequest?.asset ?? 'VER',
        sender: 'identity_preview_sender',
        receiver: paymentRequest?.receiver ?? 'identity_preview_receiver',
        status: 'confirmed',
      },
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'done',
        message: 'No chain transaction was sent. This receipt is a local AHIP preview.',
      },
    ],
    state_patches: [createActionPatch(context)],
  }, scenarioId)
}

function createToolResultFromIntent(context: AhipScenarioActionContext) {
  const scenarioId = 'tool_intent'
  return validItem({
    ...baseItem(context.sessionId, scenarioId, 'Preview tool result generated.', 'tool_result', PREVIEW_HOST_ACTOR),
    content: [
      { id: makePreviewId('block'), type: 'status', status: 'done', message: 'Preview tool completed locally.' },
      {
        id: makePreviewId('block'),
        type: 'table',
        title: 'Tool result',
        columns: [
          { key: 'field', title: 'Field' },
          { key: 'value', title: 'Value' },
        ],
        rows: [
          { field: 'Tool', value: 'preview.search_docs' },
          { field: 'Mode', value: 'local preview' },
        ],
      },
    ],
    tool_intents: context.item.tool_intents?.map((intent) => ({
      ...intent,
      status: 'completed',
    })),
    state_patches: [createActionPatch(context)],
  }, scenarioId)
}

function getBoardFromItem(item: AHIPItem): GomokuBoard {
  const board = item.widgets?.find((widget) => widget.widget_type === 'dev.vibly/gomoku_board')?.props.board
  if (Array.isArray(board)) return board as GomokuBoard
  return emptyBoard()
}

function findAgentMove(board: GomokuBoard) {
  const center = 7
  if (!board[center]?.[center]) return { row: center, col: center }

  for (let radius = 1; radius < board.length; radius += 1) {
    for (let row = Math.max(0, center - radius); row <= Math.min(14, center + radius); row += 1) {
      for (let col = Math.max(0, center - radius); col <= Math.min(14, center + radius); col += 1) {
        if (!board[row]?.[col]) return { row, col }
      }
    }
  }

  return null
}

function handleGomokuAction(context: AhipScenarioActionContext) {
  const payload = context.action.payload ?? {}
  if (payload.action === 'restart') {
    return createGomokuItem(context.sessionId, emptyBoard(), 'Board restarted. Your turn.')
  }

  if (payload.action === 'place_stone' && typeof payload.row === 'number' && typeof payload.col === 'number') {
    const board = getBoardFromItem(context.item).map((row) => [...row])
    const row = payload.row
    const col = payload.col

    if (board[row]?.[col]) {
      return createGomokuItem(context.sessionId, board, 'That cell is already occupied. Choose another point.')
    }

    board[row][col] = 'black'
    const agentMove = findAgentMove(board)
    if (agentMove) {
      board[agentMove.row][agentMove.col] = 'white'
    }

    return createGomokuItem(
      context.sessionId,
      board,
      agentMove
        ? `You placed ${row + 1},${col + 1}. Agent placed ${agentMove.row + 1},${agentMove.col + 1}.`
        : 'Board is full.',
    )
  }

  return createGenericActionResult(context, 'gomoku_widget')
}

function handleBoardFallbackAction(context: AhipScenarioActionContext) {
  const template = context.action.payload?.template

  if (context.action.kind === 'reply_with_template' && typeof template === 'string') {
    const scenario = selectAhipScenario(template)
    const decision = scenario.createDecision(context.sessionId, template)

    if (decision.mode === 'plain_text') {
      return createTextItem(context.sessionId, 'board_fallback', template)
    }

    return assertValidAHIPItem(decision.item)
  }

  // For continue_task with "Play with text-based board", generate a text-based board
  const requestedApplet = context.action.payload?.requested_applet
  if (context.action.kind === 'continue_task' && typeof requestedApplet === 'string' && context.action.id === 'continue_board_text') {
    return createTextBasedBoardItem(context.sessionId, requestedApplet)
  }

  return createGenericActionResult(context, 'board_fallback')
}

function createTextBasedBoardItem(sessionId: string, gameName: string): AHIPItem {
  const scenarioId = 'board_fallback'
  const isChess = /chess|国际象棋/i.test(gameName)
  const boardMarkdown = isChess
    ? [
        '```',
        '    a   b   c   d   e   f   g   h',
        '  +---+---+---+---+---+---+---+---+',
        '8 | ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ | 8',
        '  +---+---+---+---+---+---+---+---+',
        '7 | ♟ | ♟ | ♟ | ♟ | ♟ | ♟ | ♟ | ♟ | 7',
        '  +---+---+---+---+---+---+---+---+',
        '6 |   |   |   |   |   |   |   |   | 6',
        '  +---+---+---+---+---+---+---+---+',
        '5 |   |   |   |   |   |   |   |   | 5',
        '  +---+---+---+---+---+---+---+---+',
        '4 |   |   |   |   |   |   |   |   | 4',
        '  +---+---+---+---+---+---+---+---+',
        '3 |   |   |   |   |   |   |   |   | 3',
        '  +---+---+---+---+---+---+---+---+',
        '2 | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | 2',
        '  +---+---+---+---+---+---+---+---+',
        '1 | ♖ | ♘ | ♗ | ♕ | ♔ | ♗ | ♘ | ♖ | 1',
        '  +---+---+---+---+---+---+---+---+',
        '    a   b   c   d   e   f   g   h',
        '```',
      ].join('\n')
    : [
        '```',
        `${gameName} - Text-based board`,
        'Board will be rendered here.',
        '```',
      ].join('\n')

  return validItem({
    ...baseItem(
      sessionId,
      scenarioId,
      `${gameName} text-based interactive board. Type your moves using standard notation.`,
    ),
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'idle',
        message: `${gameName} — Text-based mode. White to move.`,
      },
      {
        id: makePreviewId('block'),
        type: 'markdown',
        markdown: boardMarkdown,
      },
      {
        id: makePreviewId('block'),
        type: 'markdown',
        markdown: isChess
          ? 'Enter your move in algebraic notation (e.g., **e2e4**, **Nf3**, **O-O**).'
          : `Enter your move for ${gameName}.`,
      },
    ],
    actions: [
      {
        id: 'make_move',
        label: 'Make a move',
        kind: 'reply_with_template',
        style: 'primary',
        payload: {
          template: isChess ? 'e2e4' : 'Enter move',
        },
        fallback_text: 'Type your move.',
      },
      {
        id: 'continue_play',
        label: 'Continue playing',
        kind: 'continue_task',
        payload: {
          requested_applet: gameName,
          instruction: `Continue the ${gameName} text-based game. Render the updated board as markdown and prompt for the next move. Do NOT re-propose tool_intents.`,
        },
      },
    ],
  }, scenarioId)
}

function boardGameName(userText: string) {
  if (/国际象棋|chess/i.test(userText)) return 'Chess'
  if (/象棋|中国象棋|chinese chess|xiangqi/i.test(userText)) return 'Xiangqi'
  if (/围棋|go game|围碁/i.test(userText)) return 'Go'
  return 'Board game'
}

export const AHIP_PROTOCOL_SCENARIOS: AhipProtocolScenario[] = [
  {
    id: 'plain_text',
    title: 'Plain text',
    promptExamples: ['Explain AHIP in one sentence', 'Say hello briefly'],
    match: [/plain text|one sentence|简单解释|一句话|hello|你好/i],
    acceptanceNotes: 'Simple questions should avoid AHIP UI.',
    expected: {},
    createDecision: () => ({
      mode: 'plain_text',
      text:
        'I will keep this as plain text because it does not need durable AHIP UI. Ask for a form, table, chart, artifact, approval, payment, tool, fallback, or a stateful applet to see AHIP rendering.',
    }),
  },
  {
    id: 'markdown',
    title: 'Markdown and text blocks',
    promptExamples: ['Show markdown guidance', 'Render a markdown AHIP item'],
    match: [/markdown|text block|文本块/i],
    acceptanceNotes: 'Structured text may still be a valid AHIP item.',
    expected: { blocks: ['markdown', 'quote'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createMarkdownItem(sessionId) }),
  },
  {
    id: 'form',
    title: 'Form',
    promptExamples: ['Create a setup form', '收集报名信息'],
    match: [/form|survey|collect|填写|表单|收集|配置|问卷|报名/i],
    acceptanceNotes: 'Forms should expose submit_form and create a local action result.',
    expected: { blocks: ['form', 'status'], actions: ['submit_form', 'continue_task'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createFormItem(sessionId) }),
    handleAction: createGenericActionResult,
  },
  {
    id: 'table',
    title: 'Table',
    promptExamples: ['Show a comparison table', '生成对比表格'],
    match: [/\btable\b|\bcompare\b|\blist\b|\brank\b|表格|对比|列表|排行/i],
    acceptanceNotes: 'Tabular data should render as a table block.',
    expected: { blocks: ['table'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createTableItem(sessionId) }),
  },
  {
    id: 'chart',
    title: 'Chart',
    promptExamples: ['Show a chart', '画一个趋势图'],
    match: [/chart|graph|trend|趋势|图表|柱状图|折线图/i],
    acceptanceNotes: 'Quantitative data should render as a chart block.',
    expected: { blocks: ['chart'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createChartItem(sessionId) }),
  },
  {
    id: 'entity_card',
    title: 'Entity card',
    promptExamples: ['Show an agent card', '展示实体卡片'],
    match: [/entity|profile|card|agent card|实体|卡片|资料/i],
    acceptanceNotes: 'Entity summaries should render as entity cards.',
    expected: { blocks: ['entity_card'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createEntityCardItem(sessionId) }),
  },
  {
    id: 'status',
    title: 'Status',
    promptExamples: ['Show task status', '显示任务状态'],
    match: [/status|progress|task|状态|进度|任务/i],
    acceptanceNotes: 'Task state should use status/stat and actions.',
    expected: { blocks: ['status', 'stat'], actions: ['continue_task', 'retry'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createStatusItem(sessionId) }),
    handleAction: createGenericActionResult,
  },
  {
    id: 'error',
    title: 'Error',
    promptExamples: ['Show a recoverable error', '展示错误恢复'],
    match: [/error|failure|recover|错误|失败|恢复/i],
    acceptanceNotes: 'Recoverable failures should render an error block.',
    expected: { blocks: ['error'], actions: ['retry', 'continue_task'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createErrorPreviewItem(sessionId) }),
    handleAction: createGenericActionResult,
  },
  {
    id: 'approval',
    title: 'Approval',
    promptExamples: ['Request approval', '请求审批'],
    match: [/approve|approval|confirm|authorize|确认|授权|审批|同意/i],
    acceptanceNotes: 'Approval request actions should produce approval_response.',
    expected: { blocks: ['status'], actions: ['approve', 'reject'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createApprovalItem(sessionId) }),
    handleAction: createApprovalResponse,
  },
  {
    id: 'payment',
    title: 'Payment',
    promptExamples: ['Preview a payment request', '生成支付请求'],
    match: [/payment|pay|invoice|receipt|付款|支付|收款|账单|收据/i],
    acceptanceNotes: 'Payment is local preview only and returns a receipt.',
    expected: { blocks: ['payment_request'], actions: ['initiate_payment', 'reject'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createPaymentItem(sessionId) }),
    handleAction: (context) => context.action.kind === 'reject' ? createApprovalResponse(context) : createPaymentReceipt(context),
  },
  {
    id: 'tool_intent',
    title: 'Tool intent',
    promptExamples: ['Show a tool intent', '声明工具调用意图'],
    match: [/tool intent|invoke tool|tool call|工具|调用/i],
    acceptanceNotes: 'Tool intent should describe proposed args and produce tool_result.',
    expected: { blocks: ['status'], actions: ['invoke_tool', 'retry'] },
    createDecision: (sessionId) => ({ mode: 'tool_intent', item: createToolIntentItem(sessionId) }),
    handleAction: createToolResultFromIntent,
  },
  {
    id: 'tool_result',
    title: 'Tool result',
    promptExamples: ['Show a tool result', '展示工具结果'],
    match: [/tool result|工具结果/i],
    acceptanceNotes: 'Tool result should render as a completed tool_result item.',
    expected: { blocks: ['status', 'markdown'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createToolResultItem(sessionId) }),
  },
  {
    id: 'artifact',
    title: 'Artifact',
    promptExamples: ['Announce an artifact', '打开报告 artifact'],
    match: [/artifact|report|file|document|报告|文件|文档/i],
    acceptanceNotes: 'Artifact open should go through artifactOpener and be recorded.',
    expected: { blocks: ['markdown'], artifacts: ['report'], actions: ['open_artifact'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createArtifactItem(sessionId) }),
    handleAction: createGenericActionResult,
  },
  {
    id: 'state_patch',
    title: 'State patch',
    promptExamples: ['Create a state patch', '生成状态补丁'],
    match: [/state patch|patch state|状态补丁|状态更新/i],
    acceptanceNotes: 'State patches should be visible and persisted in the item.',
    expected: { blocks: ['status'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createStatePatchItem(sessionId) }),
  },
  {
    id: 'unsupported_fallback',
    title: 'Unsupported fallback',
    promptExamples: ['Show unsupported fallback', '展示不支持组件 fallback'],
    match: [/unsupported|fallback|custom block|custom widget|不支持|降级/i],
    acceptanceNotes: 'Unsupported custom UI must include fallback_text.',
    expected: { blocks: ['dev.vibly/unsupported_panel'], widgets: ['dev.vibly/unsupported_widget'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createUnsupportedFallbackItem(sessionId) }),
  },
  {
    id: 'gomoku_widget',
    title: 'Gomoku widget',
    promptExamples: ['Let us play gomoku', '我们来下一盘五子棋吧'],
    match: [/gomoku|五子棋/i],
    acceptanceNotes: 'Gomoku validates stateful widget interaction without hard-coding the skill around one game.',
    expected: { blocks: ['status'], actions: ['invoke_widget_action', 'continue_task'], widgets: ['dev.vibly/gomoku_board'] },
    createDecision: (sessionId) => ({ mode: 'ahip_item', item: createGomokuItem(sessionId) }),
    handleAction: handleGomokuAction,
  },
  {
    id: 'board_fallback',
    title: 'Board fallback',
    promptExamples: ['我们下象棋吧', 'Let us play chess'],
    match: [/象棋|中国象棋|chinese chess|xiangqi|国际象棋|chess|围棋|go game|围碁|棋盘|board game|下棋|play.*game|来一盘/i],
    acceptanceNotes: 'Other stateful board games should become AHIP fallback with a text-based interactive board when no widget is registered. Continuation should NOT re-propose the same tool_intent.',
    expected: { blocks: ['status', 'entity_card', 'markdown'], actions: ['invoke_tool', 'continue_task'] },
    createDecision: (sessionId, userText) => ({
      mode: 'ahip_item',
      item: createBoardIntentItem(
        sessionId,
        requestedAppletName(userText),
        isAppletContinuationPrompt(userText),
      ),
    }),
    handleAction: handleBoardFallbackAction,
  },
]

export function selectAhipScenario(userText: string): AhipProtocolScenario {
  if (/requested_applet|stateful applet|applet renderer|matching_widget_type|applet_renderer|capability-safe fallback/i.test(userText)) {
    return getAhipScenarioById('board_fallback') ?? AHIP_PROTOCOL_SCENARIOS[0]
  }

  return AHIP_PROTOCOL_SCENARIOS.find((scenario) =>
    scenario.match.some((matcher) => matcher.test(userText)),
  ) ?? AHIP_PROTOCOL_SCENARIOS[0]
}

export function getAhipScenarioById(scenarioId: string | undefined): AhipProtocolScenario | undefined {
  if (!scenarioId) return undefined
  return AHIP_PROTOCOL_SCENARIOS.find((scenario) => scenario.id === scenarioId)
}

export function createScenarioFixtures(sessionId = 'session_ahip_fixture'): AhipScenarioFixture[] {
  return AHIP_PROTOCOL_SCENARIOS.map((scenario) => {
    const prompt = scenario.promptExamples[0] ?? scenario.title
    return {
      scenarioId: scenario.id,
      prompt,
      decision: scenario.createDecision(sessionId, prompt),
      expected: scenario.expected,
    }
  })
}

export function scenarioSummaryForPrompt() {
  return AHIP_PROTOCOL_SCENARIOS
    .map((scenario) => {
      const examples = scenario.promptExamples.join(' | ')
      const blocks = scenario.expected.blocks?.join(', ') ?? 'none'
      const actions = scenario.expected.actions?.join(', ') ?? 'none'
      const artifacts = scenario.expected.artifacts?.join(', ') ?? 'none'
      const widgets = scenario.expected.widgets?.join(', ') ?? 'none'
      return `- ${scenario.id}: ${scenario.title}. Examples: ${examples}. Blocks: ${blocks}. Actions: ${actions}. Artifacts: ${artifacts}. Widgets: ${widgets}. ${scenario.acceptanceNotes}`
    })
    .join('\n')
}

export { createGenericActionResult }
