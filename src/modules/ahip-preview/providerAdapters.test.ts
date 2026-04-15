import { describe, expect, it } from 'vitest'
import { extractJsonObject, shouldUsePromptedJson } from './providerAdapters'
import type { AhipPreviewAgent, GenerateDecisionInput } from './types'

const baseAgent: AhipPreviewAgent = {
  agentId: 'agent_provider_test',
  name: 'Provider Test Agent',
  provider: 'openai-compatible',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  systemPrompt: 'Test agent',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}

function inputFor(agent: AhipPreviewAgent): GenerateDecisionInput {
  return {
    agent,
    apiKey: 'test-key',
    userText: 'hello',
    transcript: [],
    skillManifest: 'AHIP test manifest',
  }
}

describe('AHIP provider adapters', () => {
  it('extracts a JSON object from plain, fenced, and prefixed model text', () => {
    expect(extractJsonObject('{"mode":"plain_text","text":"ok"}')).toBe(
      '{"mode":"plain_text","text":"ok"}',
    )
    expect(extractJsonObject('```json\n{"mode":"plain_text","text":"ok"}\n```')).toBe(
      '{"mode":"plain_text","text":"ok"}',
    )
    expect(extractJsonObject('Here is the object: {"mode":"plain_text","text":"ok"} done')).toBe(
      '{"mode":"plain_text","text":"ok"}',
    )
  })

  it('does not stop at braces inside JSON strings', () => {
    expect(extractJsonObject('{"mode":"plain_text","text":"literal } brace"} trailing')).toBe(
      '{"mode":"plain_text","text":"literal } brace"}',
    )
  })

  it('routes DeepSeek and non-OpenAI compatible endpoints through prompted JSON', () => {
    expect(
      shouldUsePromptedJson(inputFor({
        ...baseAgent,
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
      })),
    ).toBe(true)
    expect(
      shouldUsePromptedJson(inputFor({
        ...baseAgent,
        provider: 'openai-compatible',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
      })),
    ).toBe(true)
    expect(
      shouldUsePromptedJson(inputFor({
        ...baseAgent,
        provider: 'openai-compatible',
        baseUrl: 'http://localhost:11434/v1',
        model: 'llama3.2',
      })),
    ).toBe(true)
  })

  it('keeps official OpenAI endpoints on structured output', () => {
    expect(
      shouldUsePromptedJson(inputFor({ ...baseAgent, baseUrl: 'https://api.openai.com/v1' })),
    ).toBe(false)
    expect(shouldUsePromptedJson(inputFor({ ...baseAgent, baseUrl: '' }))).toBe(false)
  })
})
