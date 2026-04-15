import type { ToolIntent } from '@ahip/core'
import type { GenerateDecisionInput } from './types'
import { executeRegisterApplet } from './registerAppletHandler'

export interface ToolExecutionResult {
  status: 'completed' | 'failed'
  output?: unknown
  error?: string
}

export type ToolHandler = (
  intent: ToolIntent,
  context: ToolExecutionContext,
) => Promise<ToolExecutionResult>

export interface ToolExecutionContext {
  sessionId: string
  generateInput: GenerateDecisionInput
}

const toolHandlers = new Map<string, ToolHandler>()

export function registerToolHandler(toolName: string, handler: ToolHandler) {
  toolHandlers.set(toolName, handler)
}

export function getToolHandler(toolName: string): ToolHandler | undefined {
  return toolHandlers.get(toolName)
}

export function hasToolHandler(toolName: string): boolean {
  return toolHandlers.has(toolName)
}

registerToolHandler('register_applet', executeRegisterApplet)
registerToolHandler('render_stateful_applet', executeRegisterApplet)
