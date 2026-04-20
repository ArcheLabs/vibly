import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AHIPAction, AHIPItem, ArtifactRef, WidgetRef } from '@ahip/core'
import {
  AHIPFallbackRenderer,
  AHIPItemRenderer,
  type AHIPAppletRegistry,
  type AHIPRenderErrorContext,
  type AHIPWidgetRenderer,
} from '@ahip/react'
import { AHIP_PREVIEW_CAPABILITIES, getRuntimeCapabilities } from '@/modules/ahip-preview/capabilities'
import { hasDynamicApplet, subscribeDynamicApplets, listDynamicAppletTypes } from '@/modules/ahip-preview/dynamicAppletRegistry'
import { DynamicAppletRenderer } from './DynamicAppletRenderer'
import type { AhipPreviewMessage } from '@/modules/ahip-preview/types'
import { cn } from '@/lib/utils'

type AhipMessageRendererProps = {
  message: AhipPreviewMessage
  onAction: (action: AHIPAction, item: AHIPItem) => void | Promise<void>
  onArtifactOpen?: (artifact: ArtifactRef, item: AHIPItem) => void | Promise<void>
  onRenderError?: (item: AHIPItem, message: string) => void
}

function getBoard(widget: WidgetRef) {
  const board = widget.props.board
  if (!Array.isArray(board)) return []
  return board as Array<Array<'black' | 'white' | null>>
}

const gomokuRenderer: AHIPWidgetRenderer = ({ widget, item, host }) => {
  const board = getBoard(widget)
  const note = typeof widget.props.note === 'string' ? widget.props.note : 'Place a stone.'
  const terminal = widget.props.terminal === true
  const winner = widget.props.winner === 'black'
    ? 'Black wins'
    : widget.props.winner === 'white'
      ? 'White wins'
      : null

  return (
    <section className="space-y-3" data-ahip-widget="dev.vibly/gomoku_board">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-primary">Gomoku preview</p>
          <p className="mt-1 text-xs text-secondary">{note}</p>
        </div>
        <div className="flex gap-2 text-xs text-muted">
          <span>Black: you</span>
          <span>White: agent</span>
          {winner ? <span className="text-primary">{winner}</span> : null}
        </div>
      </div>
      <div className="grid w-full max-w-[480px] grid-cols-[repeat(15,minmax(0,1fr))] overflow-hidden border border-default bg-secondary">
        {board.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              className="aspect-square border border-default bg-surface p-0 text-[10px] leading-none transition hover-bg-muted"
              aria-label={`Place stone at row ${rowIndex + 1}, column ${colIndex + 1}`}
              disabled={Boolean(cell) || terminal}
              onClick={() => {
                void host.actionDispatcher?.dispatchAction(
                  {
                    id: `place_${rowIndex}_${colIndex}`,
                    label: `Place ${rowIndex + 1},${colIndex + 1}`,
                    kind: 'invoke_widget_action',
                    payload: {
                      widget_id: widget.widget_id,
                      action: 'place_stone',
                      row: rowIndex,
                      col: colIndex,
                    },
                  },
                  { item },
                )
              }}
            >
              <span
                className={cn(
                  'mx-auto block h-[68%] w-[68%] rounded-full',
                  cell === 'black' ? 'bg-[var(--text-primary)]' : '',
                  cell === 'white' ? 'border border-strong bg-panel' : '',
                )}
              />
            </button>
          )),
        )}
      </div>
    </section>
  )
}

function createAppletRegistry(): AHIPAppletRegistry {
  return {
    resolveWidgetRenderer(widget) {
      if (widget.widget_type === 'dev.vibly/gomoku_board') return gomokuRenderer
      if (widget.widget_type.startsWith('dev.vibly/dynamic_') || hasDynamicApplet(widget.widget_type)) {
        return DynamicAppletRenderer
      }
      return undefined
    },
  }
}

function getRenderErrorMessage(context: AHIPRenderErrorContext) {
  if (context.error instanceof Error) return context.error.message
  return `Unable to render ${context.area} ${context.identifier}.`
}

export function AhipMessageRenderer({
  message,
  onAction,
  onArtifactOpen,
  onRenderError,
}: AhipMessageRendererProps) {
  const [renderErrors, setRenderErrors] = useState<string[]>([])
  const itemId = message.kind === 'ahip' ? message.item.item_id : null

  // Re-render when dynamic applets are registered
  const dynamicAppletSnapshot = useSyncExternalStore(
    subscribeDynamicApplets,
    () => listDynamicAppletTypes().join(','),
  )
  const appletRegistry = createAppletRegistry()
  const capabilities = getRuntimeCapabilities()

  useEffect(() => {
    setRenderErrors([])
  }, [itemId])

  if (message.kind === 'text') {
    const isUser = message.role === 'user'

    return (
      <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[78%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
            isUser ? 'bg-accent text-accent-foreground' : 'border border-default bg-panel text-primary',
          )}
        >
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-default bg-panel p-3 text-sm text-primary">
      {renderErrors.length ? (
        <div className="mb-3 rounded-md border border-default bg-muted px-3 py-2 text-xs text-warning">
          AHIP renderer fallback used: {renderErrors.join('; ')}
        </div>
      ) : null}
      <AHIPItemRenderer
        appletRegistry={appletRegistry}
        capabilities={capabilities}
        fallbackRenderer={AHIPFallbackRenderer}
        item={message.item}
        onRenderError={(context) => {
          const errorMessage = getRenderErrorMessage(context)
          console.warn('AHIP render error', context)
          queueMicrotask(() => {
            setRenderErrors((current) => current.includes(errorMessage) ? current : [...current, errorMessage])
            onRenderError?.(context.item, errorMessage)
          })
        }}
        actionDispatcher={{
          dispatchAction(action, context) {
            return onAction(action, context.item)
          },
        }}
        artifactOpener={{
          openArtifact(artifact, context) {
            return onArtifactOpen?.(artifact, context.item)
          },
        }}
      />
    </div>
  )
}
