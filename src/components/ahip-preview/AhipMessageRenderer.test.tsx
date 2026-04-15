import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { assertValidAHIPItem } from '@ahip/core'
import { createScenarioFixtures } from '@/modules/ahip-preview/scenarioMatrix'
import type { AhipPreviewMessage } from '@/modules/ahip-preview/types'
import { AhipMessageRenderer } from './AhipMessageRenderer'

function messageForScenario(scenarioId: string): AhipPreviewMessage {
  const fixture = createScenarioFixtures().find((item) => item.scenarioId === scenarioId)
  if (!fixture || fixture.decision.mode === 'plain_text') {
    throw new Error(`Missing AHIP fixture for ${scenarioId}`)
  }

  return {
    messageId: `msg_${scenarioId}`,
    sessionId: 'session_renderer_test',
    role: 'assistant',
    kind: 'ahip',
    item: assertValidAHIPItem(fixture.decision.item),
    createdAt: new Date(0).toISOString(),
  }
}

describe('AhipMessageRenderer', () => {
  it('renders core content blocks', () => {
    render(<AhipMessageRenderer message={messageForScenario('chart')} onAction={vi.fn()} />)

    expect(screen.getByText('Weekly preview usage')).toBeInTheDocument()
    expect(screen.getByText('Chart type: bar')).toBeInTheDocument()
  })

  it('dispatches action clicks through the host runtime', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<AhipMessageRenderer message={messageForScenario('form')} onAction={onAction} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction.mock.calls[0][0]).toMatchObject({ kind: 'submit_form' })
  })

  it('routes artifact opening through artifactOpener', async () => {
    const user = userEvent.setup()
    const onArtifactOpen = vi.fn()
    render(
      <AhipMessageRenderer
        message={messageForScenario('artifact')}
        onAction={vi.fn()}
        onArtifactOpen={onArtifactOpen}
      />,
    )

    const buttons = screen.getAllByRole('button', { name: 'Open artifact' })
    await user.click(buttons[buttons.length - 1])

    expect(onArtifactOpen).toHaveBeenCalledTimes(1)
    expect(onArtifactOpen.mock.calls[0][0]).toMatchObject({ kind: 'report' })
  })

  it('shows fallback text for unsupported custom UI', () => {
    render(<AhipMessageRenderer message={messageForScenario('unsupported_fallback')} onAction={vi.fn()} />)

    expect(screen.getByText('Fallback: this custom block is not registered by the host.')).toBeInTheDocument()
    expect(screen.getByText('Fallback: this widget type is not registered by the host.')).toBeInTheDocument()
  })
})
