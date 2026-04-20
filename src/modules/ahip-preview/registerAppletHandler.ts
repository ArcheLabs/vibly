import type { ToolIntent } from '@ahip/core'
import { streamText } from 'ai'
import { registerDynamicApplet } from './dynamicAppletRegistry'
import { nowIso } from './storage'
import type { ToolExecutionContext, ToolExecutionResult } from './toolExecutor'
import { getCodeGenModel } from './providerAdapters'

const APPLET_GEN_TIMEOUT_MS = 3 * 60_000
const APPLET_MAX_OUTPUT_TOKENS = 8192

function buildAppletGenerationPrompt(intent: ToolIntent) {
  const appletName = resolveAppletName(intent)
  const stateSchema = intent.proposed_args?.state_schema
    ? JSON.stringify(intent.proposed_args.state_schema, null, 2)
    : null
  const actionSchema = intent.proposed_args?.action_schema
    ? JSON.stringify(intent.proposed_args.action_schema, null, 2)
    : null

  return [
    `Generate a self-contained HTML applet for: ${appletName}`,
    '',
    'Output ONLY a single valid HTML document. No explanation, no markdown fences.',
    'All CSS in <style>, all JS in <script>. No external dependencies.',
    'Dark theme by default. Use CSS Grid or Flexbox.',
    '',
    'iframe postMessage protocol:',
    '- Outbound action: parent.postMessage({ type: "ahip_widget_action", payload: { action: "...", ...data } }, "*")',
    '- For actions that need an LLM/AI response (e.g. player moves in a game against AI),',
    '  add requires_llm_response: true, a description string, and relevant state:',
    '  parent.postMessage({ type: "ahip_widget_action", payload: {',
    '    action: "player_move", move: "e2e4", description: "Player moved pawn from e2 to e4",',
    '    board_state: "<compact board representation>", requires_llm_response: true',
    '  } }, "*")',
    '- Inbound from host (AI response): addEventListener("message", e => {',
    '    if (e.data?.type === "ahip_host_action") handleHostAction(e.data.action, e.data.payload)',
    '    if (e.data?.type === "ahip_host_restore_state") restoreState(e.data.payload.state)',
    '  })',
    '  The host will send { type: "ahip_host_action", action: "ai_move", payload: { move: "e7e5", ... } }',
    '  Apply the AI move to the board and update the display.',
    '- State persistence: after every state change, send a serializable snapshot:',
    '  parent.postMessage({ type: "ahip_widget_state", payload: { state: getSerializableState() } }, "*")',
    '- On restore_state or ahip_host_restore_state, rebuild the UI from the provided state snapshot.',
    '- Resize: parent.postMessage({ type: "ahip_widget_resize", height: document.body.scrollHeight }, "*")',
    '- Call resize after initial render and after layout changes.',
    '',
    stateSchema ? `State schema: ${JSON.stringify(intent.proposed_args?.state_schema)}\n` : '',
    actionSchema ? `Action schema: ${JSON.stringify(intent.proposed_args?.action_schema)}\n` : '',
    `For ${appletName}: render a complete, playable interactive experience.`,
    'Track all game state internally. When the player makes a move,',
    'dispatch the move to the host with requires_llm_response: true so the AI can respond.',
    'When receiving ahip_host_action with the AI move, apply it to the board.',
    appletName.toLowerCase().includes('chess')
      ? 'Chess: 8x8 board with piece symbols (♔♕♖♗♘♙♚♛♜♝♞♟), click-to-select and click-to-move, basic move validation, turn tracking. Player is white, AI is black. After player moves, dispatch the move and wait for AI response via ahip_host_action.'
      : '',
  ].filter(Boolean).join('\n')
}

function extractHtmlDocument(text: string): string {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)
  const source = fenced?.[1]?.trim() ?? text.trim()

  const doctype = source.indexOf('<!DOCTYPE')
  const htmlOpen = source.indexOf('<html')
  const start = doctype >= 0 ? doctype : htmlOpen >= 0 ? htmlOpen : -1

  if (start < 0) {
    if (source.includes('<head') || source.includes('<body') || source.includes('<script')) {
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>${source}</html>`
    }
    throw new Error('Generated output does not contain valid HTML.')
  }

  const htmlClose = source.lastIndexOf('</html>')
  if (htmlClose < 0) return source.slice(start) + '</html>'
  return source.slice(start, htmlClose + '</html>'.length)
}

function sanitizeAppletHtml(html: string): string {
  const forbidden = [
    /\bfetch\s*\(/gi,
    /\bXMLHttpRequest\b/gi,
    /\bnew\s+WebSocket\b/gi,
    /\bimport\s*\(/gi,
    /\blocation\s*\.\s*href\s*=/gi,
    /\bwindow\s*\.\s*open\s*\(/gi,
    /\bdocument\s*\.\s*cookie\b/gi,
    /\blocalStorage\b/gi,
    /\bsessionStorage\b/gi,
    /\bindexedDB\b/gi,
    /\beval\s*\(/gi,
    /\bFunction\s*\(/gi,
  ]

  for (const pattern of forbidden) {
    if (pattern.test(html)) {
      throw new Error(`Generated applet contains forbidden API: ${pattern.source}`)
    }
  }

  return html
}

function resolveAppletName(intent: ToolIntent): string {
  const fromArgs = intent.proposed_args?.requested_applet
  if (typeof fromArgs === 'string' && fromArgs.trim()) return fromArgs.trim()

  const fromType = intent.proposed_args?.applet_type
  if (typeof fromType === 'string' && fromType.trim()) {
    return fromType.trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const fromTitle = intent.title
  if (typeof fromTitle === 'string' && fromTitle.trim()) {
    const cleaned = fromTitle.replace(/^(register|render|create)\s+/i, '').replace(/\s*applet$/i, '').trim()
    if (cleaned) return cleaned
  }

  return 'Applet'
}

export async function executeRegisterApplet(
  intent: ToolIntent,
  context: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const appletName = resolveAppletName(intent)
  const widgetType = `dev.vibly/dynamic_${appletName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`

  try {
    const model = getCodeGenModel(context.generateInput)
    const prompt = buildAppletGenerationPrompt(intent)

    context.generateInput.onPipelineEvent?.({
      phase: 'applet_generation',
      label: `Generating ${appletName} applet HTML...`,
      providerActive: true,
    })

    const stream = streamText({
      model,
      system: [
        'You are an expert frontend developer.',
        'Generate self-contained HTML applets for sandboxed iframes.',
        'Output ONLY the HTML document. No explanations.',
      ].join('\n'),
      prompt,
      temperature: 0.3,
      maxOutputTokens: APPLET_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      abortSignal: context.generateInput.abortSignal,
    })

    // Stream with progress tracking
    let tokenCount = 0
    let lastEventAt = 0
    const textParts: string[] = []
    const reader = stream.textStream

    for await (const chunk of reader) {
      textParts.push(chunk)
      tokenCount += 1
      const now = Date.now()
      // Emit progress every ~2 seconds to avoid flooding
      if (now - lastEventAt > 2000) {
        lastEventAt = now
        context.generateInput.onPipelineEvent?.({
          phase: 'applet_generation',
          label: `Generating ${appletName}... (${tokenCount} chunks received)`,
          detail: `${textParts.join('').length} chars`,
          providerActive: true,
        })
      }
    }

    const fullText = textParts.join('')

    context.generateInput.onPipelineEvent?.({
      phase: 'provider_response',
      label: `Applet HTML received (${fullText.length} chars).`,
      detail: appletName,
      providerActive: false,
    })

    const html = sanitizeAppletHtml(extractHtmlDocument(fullText))

    await registerDynamicApplet({
      widgetType,
      displayName: appletName,
      htmlSource: html,
      registeredAt: nowIso(),
    })

    return {
      status: 'completed',
      output: {
        widget_type: widgetType,
        display_name: appletName,
        registered: true,
      },
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate applet.',
    }
  }
}
