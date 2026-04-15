import { CORE_BLOCK_TYPES, type CapabilitySet } from '@ahip/core'
import { listDynamicAppletTypes } from './dynamicAppletRegistry'

export const AHIP_PREVIEW_WIDGET_TYPES = ['dev.vibly/gomoku_board'] as const

export const AHIP_PREVIEW_CAPABILITIES: CapabilitySet = {
  protocol_version: '0.2',
  supported_item_kinds: [
    'turn',
    'tool_result',
    'approval_request',
    'approval_response',
    'state_patch',
    'artifact_announcement',
    'system_notice',
  ],
  supported_blocks: [...CORE_BLOCK_TYPES],
  supported_actions: [
    'submit_form',
    'open_url',
    'copy_text',
    'reply_with_template',
    'invoke_widget_action',
    'invoke_tool',
    'approve',
    'reject',
    'initiate_payment',
    'open_artifact',
    'retry',
    'continue_task',
  ],
  supported_widget_types: [...AHIP_PREVIEW_WIDGET_TYPES],
  supported_artifact_kinds: [
    'dataset',
    'document',
    'report',
    'deck_outline',
    'slide_spec',
    'code_bundle',
    'payment_intent',
    'task_snapshot',
    'image',
    'audio',
    'video',
    'custom',
  ],
  limits: {
    max_blocks_per_item: 8,
    max_inline_table_rows: 50,
    max_chart_points: 120,
  },
}

export function getRuntimeCapabilities(): CapabilitySet {
  const dynamicTypes = listDynamicAppletTypes()
  if (dynamicTypes.length === 0) return AHIP_PREVIEW_CAPABILITIES
  return {
    ...AHIP_PREVIEW_CAPABILITIES,
    supported_widget_types: [
      ...AHIP_PREVIEW_WIDGET_TYPES,
      ...dynamicTypes,
    ],
  }
}
