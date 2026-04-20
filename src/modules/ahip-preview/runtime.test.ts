import { describe, expect, it } from 'vitest'
import { assertValidAHIPItem } from '@ahip/core'
import type { AHIPItem } from '@ahip/core'
import { sanitizeModelAHIPItem } from './ahipItemSanitizer'
import type { AhipPreviewAgent } from './types'
import { generateAssistantMessage, getActionContinuationPrompt, handleAhipAction } from './runtime'

const agent: AhipPreviewAgent = {
  agentId: 'agent_test',
  name: 'Test AHIP Agent',
  provider: 'openai-compatible',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  systemPrompt: 'Test agent',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}

type TestStone = 'black' | 'white' | null

function emptyTestBoard() {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null as TestStone))
}

function withGomokuBoard(item: AHIPItem, board: TestStone[][]): AHIPItem {
  return {
    ...item,
    widgets: item.widgets?.map((widget) => (
      widget.widget_type === 'dev.vibly/gomoku_board'
        ? { ...widget, props: { ...widget.props, board } }
        : widget
    )),
  }
}

function getGomokuBoard(item: AHIPItem) {
  return item.widgets?.find((widget) => widget.widget_type === 'dev.vibly/gomoku_board')?.props.board as TestStone[][]
}

describe('AHIP preview runtime', () => {
  it('keeps simple questions as plain text without an API key', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Explain AHIP in one sentence',
      transcript: [],
    })

    expect(result.message.kind).toBe('text')
    expect(result.trace.mode).toBe('local_demo')
    expect(result.trace.scenarioId).toBe('plain_text')
  })

  it('generates form AHIP and handles submit_form through the runtime', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Create a setup form',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return
    expect(result.message.item.content?.some((block) => block.type === 'form')).toBe(true)

    const action = result.message.item.actions?.find((item) => item.kind === 'submit_form')
    expect(action).toBeTruthy()
    if (!action) return

    const actionResult = handleAhipAction({ action, item: result.message.item, agent })

    expect(actionResult.message.kind).toBe('ahip')
    expect(actionResult.trace.actionId).toBe(action.id)
    expect(actionResult.replaceSourceItem).toBe(false)
    if (actionResult.message.kind !== 'ahip') return
    expect(actionResult.message.item.kind).toBe('tool_result')
    expect(actionResult.message.item.state_patches?.length).toBeGreaterThan(0)
  })

  it('turns approval decisions into approval_response items', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Request approval',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    const action = result.message.item.actions?.find((item) => item.kind === 'approve')
    expect(action).toBeTruthy()
    if (!action) return

    const actionResult = handleAhipAction({ action, item: result.message.item, agent })

    expect(actionResult.message.kind).toBe('ahip')
    if (actionResult.message.kind !== 'ahip') return
    expect(actionResult.message.item.kind).toBe('approval_response')
    expect(actionResult.message.item.approvals?.[0]?.kind).toBe('response')
  })

  it('creates local payment receipts without chain execution', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Preview a payment request',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    const action = result.message.item.actions?.find((item) => item.kind === 'initiate_payment')
    expect(action).toBeTruthy()
    if (!action) return

    const actionResult = handleAhipAction({ action, item: result.message.item, agent })

    expect(actionResult.message.kind).toBe('ahip')
    if (actionResult.message.kind !== 'ahip') return
    expect(actionResult.message.item.content?.some((block) => block.type === 'payment_receipt')).toBe(true)
    expect(JSON.stringify(actionResult.message.item)).toContain('local AHIP preview')
  })

  it('keeps gomoku interaction in the source message', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Let us play gomoku',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    const action = {
      id: 'place_7_7',
      label: 'Place 8,8',
      kind: 'invoke_widget_action' as const,
      payload: {
        widget_id: 'gomoku-preview',
        action: 'place_stone',
        row: 7,
        col: 7,
      },
    }
    const actionResult = handleAhipAction({ action, item: result.message.item, agent })

    expect(actionResult.replaceSourceItem).toBe(true)
    expect(actionResult.trace.scenarioId).toBe('gomoku_widget')
  })

  it('renders Chinese gomoku prompts through the local scenario matrix', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: '我们来下五子棋吧',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    expect(result.trace.scenarioId).toBe('gomoku_widget')
    if (result.message.kind !== 'ahip') return
    expect(result.message.item.widgets?.[0]?.widget_type).toBe('dev.vibly/gomoku_board')
  })

  it('handles gomoku actions even when a model omits scenario metadata', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Let us play gomoku',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    const action = {
      id: 'place_7_7',
      label: 'Place 8,8',
      kind: 'invoke_widget_action' as const,
      payload: {
        widget_id: 'gomoku-preview',
        action: 'place_stone',
        row: 7,
        col: 7,
      },
    }
    const actionResult = handleAhipAction({
      action,
      item: { ...result.message.item, metadata: undefined },
      agent,
    })

    expect(actionResult.replaceSourceItem).toBe(true)
    expect(actionResult.trace.scenarioId).toBe('gomoku_widget')
  })

  it('blocks an immediate gomoku threat without using a model', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Let us play gomoku',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    const board = emptyTestBoard()
    board[7][7] = 'black'
    board[7][8] = 'black'
    board[7][9] = 'black'

    const actionResult = handleAhipAction({
      action: {
        id: 'place_7_10',
        label: 'Place 8,11',
        kind: 'invoke_widget_action',
        payload: {
          widget_id: 'gomoku-preview',
          action: 'place_stone',
          row: 7,
          col: 10,
        },
      },
      item: withGomokuBoard(result.message.item, board),
      agent,
    })

    expect(actionResult.message.kind).toBe('ahip')
    if (actionResult.message.kind !== 'ahip') return
    const nextBoard = getGomokuBoard(actionResult.message.item)

    expect([nextBoard[7][6], nextBoard[7][11]]).toContain('white')
  })

  it('declares gomoku win before the agent moves again', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: 'Let us play gomoku',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    const board = emptyTestBoard()
    board[7][7] = 'black'
    board[7][8] = 'black'
    board[7][9] = 'black'
    board[7][10] = 'black'

    const actionResult = handleAhipAction({
      action: {
        id: 'place_7_11',
        label: 'Place 8,12',
        kind: 'invoke_widget_action',
        payload: {
          widget_id: 'gomoku-preview',
          action: 'place_stone',
          row: 7,
          col: 11,
        },
      },
      item: withGomokuBoard(result.message.item, board),
      agent,
    })

    expect(actionResult.message.kind).toBe('ahip')
    if (actionResult.message.kind !== 'ahip') return
    const nextBoard = getGomokuBoard(actionResult.message.item)
    const whiteStones = nextBoard.flat().filter((stone) => stone === 'white')

    expect(whiteStones).toHaveLength(0)
    expect(JSON.stringify(actionResult.message.item)).toContain('You win')
  })

  it('uses AHIP fallback for non-registered board games', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: '我们下象棋吧',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    expect(result.trace.scenarioId).toBe('board_fallback')
    if (result.message.kind !== 'ahip') return
    expect(result.message.item.tool_intents?.[0]?.missing_fields).toContain('matching_widget_type')
    expect(JSON.stringify(result.message.item).toLowerCase()).not.toContain('gomoku')
  })

  it('does not redirect unsupported applets to unrelated registered widgets', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: '我们来下国际象棋吧',
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    if (result.message.kind !== 'ahip') return

    expect(JSON.stringify(result.message.item).toLowerCase()).not.toContain('gomoku')
    const action = result.message.item.actions?.find((item) => item.kind === 'continue_task')
    expect(action?.payload?.instruction).toBeDefined()
    if (!action) return

    const continuationPrompt = getActionContinuationPrompt(action, result.message.item)
    expect(continuationPrompt).toBeDefined()
    expect(continuationPrompt?.toLowerCase()).not.toContain('gomoku')
  })

  it('stops local applet continuation fallback instead of repeating the same proposal', async () => {
    const result = await generateAssistantMessage({
      agent,
      apiKey: '',
      sessionId: 'session_runtime_test',
      userText: [
        'The user selected AHIP action "Continue with capability-safe fallback".',
        'Action payload: {"requested_applet":"Chess"}',
      ].join('\n'),
      transcript: [],
    })

    expect(result.message.kind).toBe('ahip')
    expect(result.trace.scenarioId).toBe('board_fallback')
    if (result.message.kind !== 'ahip') return
    expect(result.message.item.fallback_text).toContain('cannot continue')
    expect(
      result.message.item.content?.some((block) =>
        block.type === 'status' && 'status' in block && block.status === 'failed',
      ),
    ).toBe(true)
    expect(result.message.item.actions ?? []).toHaveLength(0)
  })

  it('turns model-generated action buttons into generic agent continuation prompts', () => {
    const item = assertValidAHIPItem(sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'applet-proposal-001',
      kind: 'turn',
      actor: 'agent',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'This host does not have a dedicated renderer for the requested applet yet.',
      blocks: [
        {
          type: 'status',
          status: 'info',
          title: 'Applet proposal',
          message: 'Dedicated widget not currently supported. Using AHIP fallback representation.',
        },
      ],
      actions: [
        {
          action_id: 'start-applet',
          type: 'continue_task',
          label: 'Start Applet Flow',
          description: 'Continue with the applet using the available AHIP host capabilities',
        },
        {
          action_id: 'suggest-alternative',
          type: 'reply_with_template',
          label: 'Suggest Alternative',
          template: 'What other applet would you like to try instead?',
        },
      ],
    }, 'session_runtime_test')) as AHIPItem

    const startAction = item.actions?.find((action) => action.id === 'start-applet')
    expect(startAction).toBeTruthy()
    if (!startAction) return

    const startPrompt = getActionContinuationPrompt(startAction, item)

    expect(startPrompt).toContain('Start Applet Flow')
    expect(startPrompt).toContain('Continue the current AHIP interaction')
    expect(startPrompt).toContain('stateful applet or widget')

    const alternativeAction = item.actions?.find((action) => action.id === 'suggest-alternative')
    expect(alternativeAction).toBeTruthy()
    if (!alternativeAction) return

    expect(getActionContinuationPrompt(alternativeAction, item)).toBe(
      'What other applet would you like to try instead?',
    )
  })
})
