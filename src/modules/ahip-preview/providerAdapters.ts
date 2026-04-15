import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateObject, generateText, type LanguageModel } from 'ai'
import { z } from 'zod'
import type { AhipModelDecision, AhipRuntimePipelineEvent, GenerateDecisionInput } from './types'

const decisionSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('plain_text'),
    text: z.string(),
  }),
  z.object({
    mode: z.literal('ahip_item'),
    item: z.unknown(),
  }),
  z.object({
    mode: z.literal('tool_intent'),
    item: z.unknown(),
  }),
])

type DecisionSchema = z.infer<typeof decisionSchema>
const PROVIDER_CALL_TIMEOUT_MS = 5 * 60_000
const PROVIDER_MAX_OUTPUT_TOKENS = 4096

function getTranscriptText(input: GenerateDecisionInput) {
  return input.transcript
    .slice(-10)
    .map((message) => {
      if (message.kind === 'ahip') {
        return `${message.role}: [AHIP ${message.item.kind}] ${message.item.fallback_text ?? ''}`
      }

      return `${message.role}: ${message.text}`
    })
    .join('\n')
}

function emitPipelineEvent(input: GenerateDecisionInput, event: AhipRuntimePipelineEvent) {
  input.onPipelineEvent?.(event)
}

function isLocalEndpoint(baseUrl: string) {
  return /^(http:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(baseUrl)
}

function isOpenAIEndpoint(baseUrl: string) {
  return /^https:\/\/api\.openai\.com(?:\/|$)/i.test(baseUrl.trim())
}

export function shouldUsePromptedJson(input: GenerateDecisionInput) {
  if (input.agent.provider === 'deepseek') return true
  if (input.agent.provider === 'openrouter') return true
  if (input.agent.provider === 'ollama') return true
  if (input.agent.provider === 'lm-studio') return true
  if (input.agent.provider === 'openai-compatible') {
    const baseUrl = input.agent.baseUrl.trim()
    return baseUrl.length > 0 && !isOpenAIEndpoint(baseUrl)
  }
  return false
}

/**
 * Maps reasoning models to their faster code-generation variants.
 * Reasoning models (e.g. deepseek-reasoner) spend most of their time on
 * internal chain-of-thought tokens, which is unnecessary for code generation.
 */
const REASONING_TO_FAST_MODEL: Record<string, string> = {
  'deepseek-reasoner': 'deepseek-chat',
  'o1-preview': 'gpt-4o',
  'o1-mini': 'gpt-4o-mini',
  'o1': 'gpt-4o',
  'o3-mini': 'gpt-4o-mini',
}

function resolveModelId(input: GenerateDecisionInput, preferFast: boolean): string {
  if (!preferFast) return input.agent.model
  return REASONING_TO_FAST_MODEL[input.agent.model] ?? input.agent.model
}

function buildModel(input: GenerateDecisionInput, modelId: string): LanguageModel {
  const apiKey = input.apiKey || undefined

  if (input.agent.provider === 'webllm') {
    throw new Error('WebLLM is planned but not implemented in this LangGraph runtime yet.')
  }

  if (input.agent.provider === 'anthropic') {
    return createAnthropic({
      apiKey,
      baseURL: input.agent.baseUrl || undefined,
    })(modelId)
  }

  if (input.agent.provider === 'gemini') {
    return createGoogleGenerativeAI({
      apiKey,
      baseURL: input.agent.baseUrl || undefined,
    })(modelId)
  }

  if (input.agent.provider === 'openai-compatible' && !shouldUsePromptedJson(input)) {
    return createOpenAI({
      apiKey,
      baseURL: input.agent.baseUrl || undefined,
    })(modelId)
  }

  const defaultBaseURL = input.agent.provider === 'deepseek'
    ? 'https://api.deepseek.com'
    : 'http://localhost:1234/v1'
  const provider = createOpenAICompatible({
    name: input.agent.provider,
    baseURL: input.agent.baseUrl.replace(/\/+$/, '') || defaultBaseURL,
    apiKey,
    supportsStructuredOutputs: !shouldUsePromptedJson(input),
  })

  return provider(modelId)
}

export function getModel(input: GenerateDecisionInput): LanguageModel {
  return buildModel(input, resolveModelId(input, false))
}

/**
 * Returns a fast model suitable for code generation tasks.
 * Falls back to the agent's configured model if no fast variant exists.
 */
export function getCodeGenModel(input: GenerateDecisionInput): LanguageModel {
  return buildModel(input, resolveModelId(input, true))
}

export function extractJsonObject(text: string) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const source = fenced?.[1]?.trim() ?? trimmed
  const start = source.indexOf('{')
  if (start < 0) {
    throw new Error('Model did not return a JSON object.')
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }

  throw new Error('Model returned incomplete JSON.')
}

async function generatePromptedJsonDecision(
  input: GenerateDecisionInput,
  prompt: string,
  label: string,
) {
  emitPipelineEvent(input, {
    phase: 'provider_request',
    label,
    providerActive: true,
  })
  const result = await generateText({
    model: getModel(input),
    system: [
      input.agent.systemPrompt,
      '',
      input.skillManifest,
      '',
      'Return exactly one valid JSON object and nothing else.',
      'Allowed shapes:',
      '{"mode":"plain_text","text":"..."}',
      '{"mode":"ahip_item","item":{...}}',
      '{"mode":"tool_intent","item":{...}}',
      '',
      'IMPORTANT structural rules for the "item" object:',
      '- "content" is an array of display BLOCKS ONLY (status, markdown, entity_card, table, etc.).',
      '- "tool_intents" is a SEPARATE top-level array on the item. Never put tool_intent objects inside content.',
      '- "actions" is a SEPARATE top-level array on the item. Never nest actions inside a content block.',
      '- "widgets" is a SEPARATE top-level array on the item. Never put WidgetRef inside content.',
      'Do not use markdown fences. Do not explain your answer outside JSON.',
    ].join('\n'),
    prompt,
    temperature: 0,
    maxOutputTokens: PROVIDER_MAX_OUTPUT_TOKENS,
    maxRetries: 0,
    abortSignal: input.abortSignal,
    timeout: PROVIDER_CALL_TIMEOUT_MS,
  })
  emitPipelineEvent(input, {
    phase: 'provider_response',
    label: 'Model response received.',
    detail: label,
    providerActive: false,
  })
  emitPipelineEvent(input, {
    phase: 'parsing_model_output',
    label: 'Parsing model JSON.',
    providerActive: false,
  })
  const parsed = JSON.parse(extractJsonObject(result.text))
  const decision = decisionSchema.safeParse(parsed)

  if (!decision.success) {
    throw new Error(`Model JSON did not match AHIP decision schema: ${decision.error.message}`)
  }

  return decision.data
}

async function generateDecisionObject(input: GenerateDecisionInput, prompt: string, label: string) {
  if (shouldUsePromptedJson(input)) {
    return generatePromptedJsonDecision(input, prompt, label)
  }

  emitPipelineEvent(input, {
    phase: 'provider_request',
    label,
    providerActive: true,
  })
  const result = await generateObject({
    model: getModel(input),
    schema: decisionSchema,
    schemaName: 'AhipAgentDecision',
    schemaDescription: 'Decision to answer as plain text or as a valid AHIP v0.2 item.',
    system: [
      input.agent.systemPrompt,
      '',
      input.skillManifest,
      '',
      'Return a JSON object matching the provided schema. Do not include markdown fences.',
      'Reminder: tool_intents, actions, and widgets are TOP-LEVEL arrays on the AHIPItem, not inside content blocks.',
    ].join('\n'),
    prompt,
    temperature: 0,
    maxOutputTokens: PROVIDER_MAX_OUTPUT_TOKENS,
    maxRetries: 0,
    abortSignal: input.abortSignal,
    timeout: PROVIDER_CALL_TIMEOUT_MS,
  })
  emitPipelineEvent(input, {
    phase: 'provider_response',
    label: 'Structured model response received.',
    detail: label,
    providerActive: false,
  })

  return result.object as DecisionSchema
}

export async function generateProviderDecision(input: GenerateDecisionInput): Promise<AhipModelDecision> {
  if (!input.apiKey && !isLocalEndpoint(input.agent.baseUrl)) {
    throw new Error('No API key configured for this agent.')
  }

  return generateDecisionObject(
    input,
    [
      'Recent transcript:',
      getTranscriptText(input),
      '',
      `Current user message: ${input.userText}`,
    ].join('\n'),
    'Waiting for model AHIP decision.',
  )
}

export async function testProviderDecision(input: Omit<GenerateDecisionInput, 'userText' | 'transcript'>) {
  const decision = await generateProviderDecision({
    ...input,
    userText:
      'Provider connectivity test. Reply with plain_text only and say "AHIP provider test ok".',
    transcript: [],
  })

  if (decision.mode === 'plain_text') {
    return decision.text
  }

  return `Provider returned ${decision.mode}; structured generation is available.`
}

export async function repairProviderDecision(
  input: GenerateDecisionInput & {
    invalidItem: unknown
    validationErrors: string[]
  },
): Promise<AhipModelDecision> {
  return generateDecisionObject(
    input,
    [
      'The previous response failed AHIP validation. Repair it once.',
      'Return the full corrected decision JSON only. Do not explain the repair.',
      '',
      'Validation errors:',
      input.validationErrors.map((error) => `- ${error}`).join('\n'),
      '',
      'Repair rules:',
      '- Keep the response as an AHIP item if the user still needs structured or durable UI.',
      '- AHIPItem must use content, not blocks.',
      '- actor must be an object with actor_id and actor_kind.',
      '- markdown block text must be in markdown, not content.',
      '- status blocks use message, not description or icon.',
      '- actions may only use id, label, kind, style, disabled, payload, fallback_text, extensions. Move action-specific fields into payload.',
      '- ToolIntent may only use intent_id, tool_name, status, title, description, proposed_args, missing_fields, result_artifact_id, fallback_text, extensions.',
      '- Move ToolIntent-specific details such as risk_level, permissions, widget_type, state_schema, action_schema, required_capabilities, and renderer requirements into proposed_args or extensions.',
      '- CRITICAL: tool_intents, actions, and widgets are TOP-LEVEL arrays on the AHIPItem. They must NOT appear inside content blocks.',
      '- content[] may ONLY contain display blocks: status, markdown, text, entity_card, table, chart, form, image, code, etc.',
      '- Remove every unsupported top-level property that AJV reports as an additional property.',
      '',
      'Invalid item JSON:',
      JSON.stringify(input.invalidItem, null, 2),
      '',
      `Original user message: ${input.userText}`,
      '',
      'Return either plain_text if AHIP is no longer appropriate, or a corrected ahip_item/tool_intent.',
    ].join('\n'),
    'Repairing AHIP item with model.',
  )
}
