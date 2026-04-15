import { describe, expect, it } from 'vitest'
import { assertValidAHIPItem, validateAHIPItem } from '@ahip/core'
import {
  AHIP_PROTOCOL_SCENARIOS,
  createScenarioFixtures,
  getAhipScenarioById,
  getScenarioIdFromItem,
  inferScenarioIdFromItem,
  selectAhipScenario,
} from './scenarioMatrix'

describe('AHIP protocol scenario matrix', () => {
  it('creates a fixture for every registered scenario', () => {
    const fixtures = createScenarioFixtures()

    expect(fixtures).toHaveLength(AHIP_PROTOCOL_SCENARIOS.length)
    expect(fixtures.map((fixture) => fixture.scenarioId)).toEqual(
      AHIP_PROTOCOL_SCENARIOS.map((scenario) => scenario.id),
    )
  })

  it('validates every AHIP fixture with @ahip/core', () => {
    for (const fixture of createScenarioFixtures()) {
      if (fixture.decision.mode === 'plain_text') {
        expect(fixture.decision.text).toContain('plain text')
        continue
      }

      const item = assertValidAHIPItem(fixture.decision.item)
      const result = validateAHIPItem(item)

      expect(result.valid, fixture.scenarioId).toBe(true)
      expect(getScenarioIdFromItem(item)).toBe(fixture.scenarioId)
    }
  })

  it('fails validation when required AHIP item fields are missing', () => {
    const result = validateAHIPItem({
      protocol: 'ahip',
      version: '0.2',
      kind: 'turn',
    })

    expect(result.valid).toBe(false)
  })

  it('requires unsupported custom UI to include fallback text', () => {
    const fixture = createScenarioFixtures().find((item) => item.scenarioId === 'unsupported_fallback')
    expect(fixture?.decision.mode).toBe('ahip_item')
    if (!fixture || fixture.decision.mode === 'plain_text') return

    const item = assertValidAHIPItem(fixture.decision.item)
    const customBlock = item.content?.find((block) => block.type === 'dev.vibly/unsupported_panel')
    const customWidget = item.widgets?.find((widget) => widget.widget_type === 'dev.vibly/unsupported_widget')

    expect(customBlock?.fallback_text).toBeTruthy()
    expect(customWidget?.fallback_text).toBeTruthy()
  })

  it('can resolve scenarios by metadata id', () => {
    const fixture = createScenarioFixtures().find((item) => item.scenarioId === 'form')
    expect(fixture?.decision.mode).toBe('ahip_item')
    if (!fixture || fixture.decision.mode === 'plain_text') return

    const item = assertValidAHIPItem(fixture.decision.item)
    const scenario = getAhipScenarioById(getScenarioIdFromItem(item))

    expect(scenario?.id).toBe('form')
  })

  it('matches Chinese gomoku prompts before generic board fallback', () => {
    expect(selectAhipScenario('我们来下五子棋吧').id).toBe('gomoku_widget')
  })

  it('does not treat unlisted widget guidance as a table request', () => {
    const prompt = [
      'Continue the current AHIP interaction.',
      'Do not assume the host has an unlisted widget.',
      'Generate an applet proposal with actions.',
    ].join(' ')

    expect(selectAhipScenario(prompt).id).not.toBe('table')
  })

  it('keeps applet continuation prompts out of the status demo', () => {
    const prompt = [
      'The user selected AHIP action "Continue with capability-safe fallback".',
      'Continue the current AHIP interaction using the AHIP Skill manifest and host capabilities.',
      'If the interaction needs a stateful applet or widget, generate a valid AHIP item.',
      'Action payload: {"requested_applet":"Chess","instruction":"Continue this exact requested interaction."}',
    ].join('\n')

    expect(selectAhipScenario(prompt).id).toBe('board_fallback')
  })

  it('can infer gomoku scenario from widget type when model output omits metadata', () => {
    const fixture = createScenarioFixtures().find((item) => item.scenarioId === 'gomoku_widget')
    expect(fixture?.decision.mode).toBe('ahip_item')
    if (!fixture || fixture.decision.mode === 'plain_text') return

    const item = assertValidAHIPItem(fixture.decision.item)

    expect(inferScenarioIdFromItem({ ...item, metadata: undefined })).toBe('gomoku_widget')
  })
})
