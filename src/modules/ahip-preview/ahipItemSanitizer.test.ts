import { describe, expect, it } from 'vitest'
import { validateAHIPItem } from '@ahip/core'
import { sanitizeModelAHIPItem } from './ahipItemSanitizer'

describe('AHIP model item sanitizer', () => {
  it('converts common model aliases into strict AHIP actor and action fields', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      id: 'model_item_1',
      kind: 'turn',
      actor: {
        id: 'assistant_1',
        type: 'assistant',
        name: 'Model Agent',
        extra: 'removed',
      },
      createdAt: '2026-04-14T00:00:00.000Z',
      fallbackText: 'Fallback',
      content: [
        {
          id: 'block_1',
          type: 'status',
          status: 'waiting',
          message: 'Waiting.',
        },
      ],
      actions: [
        {
          action_id: 'continue_1',
          title: 'Continue',
          type: 'continue_task',
          description: 'Model-side explanation',
          next: 'step',
        },
      ],
      unsupportedRootField: true,
    }, 'session_sanitizer_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    expect(result.value?.actor).toEqual({
      actor_id: 'assistant_1',
      actor_kind: 'agent',
      display_name: 'Model Agent',
    })
    expect(result.value?.actions?.[0]).toMatchObject({
      id: 'continue_1',
      label: 'Continue',
      kind: 'continue_task',
      payload: {
        description: 'Model-side explanation',
        next: 'step',
      },
    })
  })

  it('converts model blocks into strict AHIP content blocks', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'model_item_2',
      kind: 'turn',
      actor: 'agent',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'Applet fallback',
      blocks: [
        {
          type: 'status',
          status: 'info',
          title: 'Applet request',
          message: 'Dedicated widget not currently supported.',
        },
        {
          type: 'entity_card',
          title: 'Applet setup',
          subtitle: 'Fallback mode',
          fields: [{ label: 'Requested applet', value: 'Stateful board' }],
        },
      ],
    }, 'session_sanitizer_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    expect(result.value?.content?.[0]).toMatchObject({
      type: 'status',
      status: 'waiting',
      title: 'Applet request',
    })
    expect(result.value?.content?.[1]).toMatchObject({
      type: 'entity_card',
      entity_kind: 'dev.vibly/model_entity',
      name: 'Applet setup',
    })
  })

  it('moves extra model tool intent fields into proposed_args', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'model_item_3',
      kind: 'turn',
      actor: 'assistant',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'Chess applet proposal',
      blocks: [
        {
          type: 'status',
          status: 'waiting',
          title: 'Chess Applet Proposal',
          description: 'Widget registration is required.',
          icon: 'settings',
        },
        {
          type: 'markdown',
          content: '## Applet Features\nA durable chess board interaction.',
        },
      ],
      tool_intents: [
        {
          id: 'register_chess',
          tool: 'register_applet',
          status: 'waiting',
          proposed_args: {
            applet_type: 'chess_game',
          },
          missingFields: ['widget_type:chess_board'],
          risk_level: 'low',
          permissions: ['read_game_state', 'submit_moves'],
          widget_type: 'chess_board',
        },
      ],
    }, 'session_sanitizer_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    expect(result.value?.content?.[0]).toMatchObject({
      type: 'status',
      message: 'Widget registration is required.',
    })
    expect(result.value?.content?.[1]).toMatchObject({
      type: 'markdown',
      markdown: '## Applet Features\nA durable chess board interaction.',
    })
    expect(result.value?.tool_intents?.[0]).toMatchObject({
      intent_id: 'register_chess',
      tool_name: 'register_applet',
      status: 'awaiting_user_input',
      missing_fields: ['widget_type:chess_board'],
      proposed_args: {
        applet_type: 'chess_game',
        risk_level: 'low',
        permissions: ['read_game_state', 'submit_moves'],
        widget_type: 'chess_board',
      },
    })
  })

  it('normalizes model entity kinds and unsupported block types into valid AHIP blocks', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'model_item_4',
      kind: 'turn',
      actor: 'assistant',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'Generic applet proposal',
      content: [
        {
          type: 'entity_card',
          entity_kind: 'game',
          title: 'Chess',
          entity_id: 'chess',
          fields: [{ label: 'Renderer', value: 'missing' }],
        },
        {
          type: 'choice panel',
          title: 'Next step',
          description: 'Choose how to continue.',
          options: ['continue', 'cancel'],
        },
      ],
    }, 'session_sanitizer_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    expect(result.value?.content?.[0]).toMatchObject({
      type: 'entity_card',
      entity_kind: 'dev.vibly/game',
      name: 'Chess',
    })
    expect(result.value?.content?.[1]).toMatchObject({
      type: 'dev.vibly/choice_panel_block',
      fallback_text: 'Choose how to continue.',
      data: {
        type: 'choice panel',
        options: ['continue', 'cancel'],
      },
    })
  })

  it('extracts tool_intent blocks from content into tool_intents array', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'model_extract_1',
      kind: 'turn',
      actor: 'assistant',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'Chess proposal',
      content: [
        {
          type: 'status',
          status: 'waiting',
          message: 'Proposing chess applet.',
        },
        {
          type: 'tool_intent',
          intent_id: 'chess_register',
          tool_name: 'register_applet',
          status: 'proposed',
          title: 'Register Chess Applet',
          proposed_args: { applet_type: 'chess' },
        },
      ],
    }, 'session_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    // tool_intent should be removed from content
    expect(result.value?.content).toHaveLength(1)
    expect(result.value?.content?.[0]).toMatchObject({ type: 'status' })
    // tool_intent should be in tool_intents array
    expect(result.value?.tool_intents).toHaveLength(1)
    expect(result.value?.tool_intents?.[0]).toMatchObject({
      intent_id: 'chess_register',
      tool_name: 'register_applet',
      status: 'proposed',
    })
  })

  it('extracts actions nested inside content blocks to the top-level actions array', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'model_extract_2',
      kind: 'turn',
      actor: 'assistant',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'Status with inline actions',
      content: [
        {
          type: 'status',
          status: 'idle',
          message: 'Choose how to continue.',
          actions: [
            {
              id: 'play_text',
              label: 'Play via Text',
              kind: 'continue_task',
              payload: { task: 'text_chess' },
            },
            {
              id: 'try_gomoku',
              label: 'Try Gomoku',
              kind: 'reply_with_template',
              payload: { template: 'Let us play Gomoku instead.' },
            },
          ],
        },
      ],
    }, 'session_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    expect(result.value?.actions).toHaveLength(2)
    expect(result.value?.actions?.[0]).toMatchObject({
      id: 'play_text',
      label: 'Play via Text',
      kind: 'continue_task',
    })
    expect(result.value?.actions?.[1]).toMatchObject({
      id: 'try_gomoku',
      label: 'Try Gomoku',
      kind: 'reply_with_template',
    })
  })

  it('sanitizes malformed widgets: normalizes widget_id aliases, strips extra permissions', () => {
    const item = sanitizeModelAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      item_id: 'model_widget_1',
      kind: 'turn',
      actor: 'assistant',
      created_at: '2026-04-14T00:00:00.000Z',
      fallback_text: 'Chess widget',
      content: [
        { type: 'markdown', markdown: 'Here is the chess board.' },
      ],
      widgets: [
        {
          widgetId: 'chess_widget',
          widget_type: 'dev.vibly/dynamic_board_game',
          props: { display_name: 'Chess' },
          permissions: {
            network: 'none',
            clipboard: false,
            wallet: false,
            storage: 'session',
            allowScripts: true,
            readState: 'full',
          },
          fallbackText: 'Chess widget fallback',
        },
      ],
    }, 'session_test')

    const result = validateAHIPItem(item)

    expect(result.valid).toBe(true)
    expect(result.value?.widgets).toHaveLength(1)
    expect(result.value?.widgets?.[0]).toMatchObject({
      widget_id: 'chess_widget',
      widget_type: 'dev.vibly/dynamic_board_game',
      props: { display_name: 'Chess' },
      fallback_text: 'Chess widget fallback',
    })
    // Extra permission properties should be stripped
    expect(result.value?.widgets?.[0].permissions).toEqual({
      network: 'none',
      clipboard: false,
      wallet: false,
      storage: 'session',
    })
  })
})
