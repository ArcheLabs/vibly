import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AHIPAction, AHIPItem, ArtifactRef } from '@ahip/core'
import { AHIP_PREVIEW_CAPABILITIES } from './capabilities'
import { inferScenarioIdFromItem } from './scenarioMatrix'
import { getAhipSkillManifest } from './skillManifest'
import {
  appendArtifactOpenEvent as persistArtifactOpenEvent,
  appendMessage as persistMessage,
  appendRuntimeTrace as persistRuntimeTrace,
  createDefaultAhipPreviewState,
  deleteSecret as persistDeleteSecret,
  exportAhipPreviewData,
  initAhipPreviewDb,
  loadAhipPreviewSnapshot,
  loadSecrets,
  makePreviewId,
  nowIso,
  replaceMessage as persistReplaceMessage,
  resetAhipPreviewDb,
  saveAgent as persistAgent,
  saveProviderTest as persistProviderTest,
  saveSecret as persistSecret,
  saveSelection,
  saveSession as persistSession,
} from './storage'
import { generateAssistantMessage, getActionContinuationPrompt, handleAhipAction } from './runtime'
import { testProviderDecision } from './providerAdapters'
import { executeToolIntent } from './toolIntentExecution'
import { hasToolHandler } from './toolExecutor'
import { dispatchWidgetAction } from './widgetActionBus'
import { clearDynamicApplets, hydrateDynamicAppletsFromDb } from './dynamicAppletRegistry'
import type {
  AhipArtifactOpenEvent,
  AhipPreviewExport,
  AhipPreviewExportScope,
  AhipProviderTest,
  AhipPreviewAgent,
  AhipPreviewMessage,
  AhipPreviewProviderKind,
  AhipPreviewSecrets,
  AhipPreviewSession,
  AhipPreviewState,
  AhipRuntimePipelineEvent,
  AhipRuntimePipelineStatus,
  AhipRuntimeTrace,
} from './types'

type NewAgentInput = {
  name: string
  avatar?: string
  bio?: string
  provider: AhipPreviewProviderKind
  baseUrl: string
  model: string
  apiKey: string
  systemPrompt: string
}

type AhipPreviewContextValue = AhipPreviewState & {
  secrets: AhipPreviewSecrets
  selectedAgent: AhipPreviewAgent | null
  selectedSession: AhipPreviewSession | null
  selectedMessages: AhipPreviewMessage[]
  selectedTraces: AhipRuntimeTrace[]
  selectedArtifactEvents: AhipArtifactOpenEvent[]
  selectedProviderTest: AhipProviderTest
  hydrating: boolean
  hydrationError: string | null
  running: boolean
  pipelineStatus: AhipRuntimePipelineStatus | null
  longRunningRequest: { operationLabel: string; timedOutAt: string } | null
  runtimeError: string | null
  createAgent: (input: NewAgentInput) => void
  updateAgent: (agentId: string, patch: Partial<Omit<AhipPreviewAgent, 'agentId' | 'createdAt'>>) => void
  updateAgentApiKey: (agentId: string, apiKey: string) => void
  deleteAgentApiKey: (agentId: string) => void
  createSession: (agentId: string) => void
  selectSession: (sessionId: string) => void
  sendMessage: (text: string) => Promise<void>
  dispatchAction: (action: AHIPAction, item: AHIPItem) => Promise<void>
  continueWaitingForProvider: () => void
  cancelRunningRequest: () => void
  openArtifact: (artifact: ArtifactRef, item: AHIPItem) => Promise<void>
  recordRenderError: (item: AHIPItem, message: string) => void
  testProvider: (agentId: string) => Promise<void>
  exportPreviewData: (scope: AhipPreviewExportScope) => Promise<AhipPreviewExport>
  resetPreview: () => Promise<void>
}

const AhipPreviewContext = createContext<AhipPreviewContextValue | null>(null)
const PROVIDER_SOFT_TIMEOUT_MS = 2 * 60_000

function createSessionRecord(agentId: string, title = 'New AHIP session'): AhipPreviewSession {
  const timestamp = nowIso()

  return {
    sessionId: makePreviewId('session'),
    agentId,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function getSessionTitle(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 'New AHIP session'
  return trimmed.length > 36 ? `${trimmed.slice(0, 33)}...` : trimmed
}

function persistSafely(action: Promise<unknown>) {
  void action.catch((error) => {
    console.warn('AHIP preview persistence failed', error)
  })
}

function getScenarioId(item: AHIPItem) {
  return inferScenarioIdFromItem(item)
}

export function AhipPreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AhipPreviewState>(() => createDefaultAhipPreviewState())
  const [secrets, setSecrets] = useState<AhipPreviewSecrets>({ apiKeysByAgentId: {} })
  const [hydrating, setHydrating] = useState(true)
  const [hydrationError, setHydrationError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [pipelineStatus, setPipelineStatus] = useState<AhipRuntimePipelineStatus | null>(null)
  const [longRunningRequest, setLongRunningRequest] = useState<{ operationLabel: string; timedOutAt: string } | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const activeAbortControllerRef = useRef<AbortController | null>(null)
  const softTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSoftTimeout = () => {
    if (!softTimeoutRef.current) return
    clearTimeout(softTimeoutRef.current)
    softTimeoutRef.current = null
  }

  const scheduleSoftTimeout = (operationLabel: string) => {
    clearSoftTimeout()
    softTimeoutRef.current = setTimeout(() => {
      setLongRunningRequest({
        operationLabel,
        timedOutAt: nowIso(),
      })
      softTimeoutRef.current = null
    }, PROVIDER_SOFT_TIMEOUT_MS)
  }

  const handlePipelineEvent = (event: AhipRuntimePipelineEvent) => {
    const timestamp = nowIso()
    setPipelineStatus((current) => ({
      ...event,
      startedAt: current?.phase === event.phase ? current.startedAt : timestamp,
      lastActivityAt: timestamp,
    }))

    if (event.providerActive) {
      setLongRunningRequest(null)
      scheduleSoftTimeout(event.label)
    } else {
      clearSoftTimeout()
      setLongRunningRequest(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setHydrating(true)
      setHydrationError(null)

      try {
        await initAhipPreviewDb()
        await hydrateDynamicAppletsFromDb()
        const [snapshot, loadedSecrets] = await Promise.all([
          loadAhipPreviewSnapshot(),
          loadSecrets(),
        ])
        if (cancelled) return
        setState(snapshot)
        setSecrets(loadedSecrets)
      } catch (error) {
        if (cancelled) return
        setState(createDefaultAhipPreviewState())
        setSecrets({ apiKeysByAgentId: {} })
        setHydrationError(error instanceof Error ? error.message : 'Unable to load AHIP preview database.')
      } finally {
        if (!cancelled) setHydrating(false)
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedAgent =
    state.agents.find((agent) => agent.agentId === state.selectedAgentId) ?? state.agents[0] ?? null
  const selectedSession =
    state.sessions.find((session) => session.sessionId === state.selectedSessionId) ??
    state.sessions.find((session) => session.agentId === selectedAgent?.agentId) ??
    null
  const selectedMessages = selectedSession ? state.messages[selectedSession.sessionId] ?? [] : []
  const selectedTraces = selectedSession ? state.runtimeTraces[selectedSession.sessionId] ?? [] : []
  const selectedArtifactEvents = selectedSession ? state.artifactOpenEvents[selectedSession.sessionId] ?? [] : []
  const selectedProviderTest: AhipProviderTest = selectedAgent
    ? state.providerTests[selectedAgent.agentId] ?? { status: 'idle' }
    : { status: 'idle' }

  const value = useMemo<AhipPreviewContextValue>(() => {
    const appendMessage = (message: AhipPreviewMessage) => {
      setState((current) => {
        const existing = current.messages[message.sessionId] ?? []
        let sessionToPersist: AhipPreviewSession | null = null
        const sessions = current.sessions.map((session) => {
          if (session.sessionId !== message.sessionId) return session

          sessionToPersist = {
            ...session,
            title:
              session.title === 'New AHIP session' && message.kind === 'text'
                ? getSessionTitle(message.text)
                : session.title,
            updatedAt: nowIso(),
          }
          return sessionToPersist
        })

        persistSafely(persistMessage(message))
        if (sessionToPersist) persistSafely(persistSession(sessionToPersist))

        return {
          ...current,
          messages: {
            ...current.messages,
            [message.sessionId]: [...existing, message],
          },
          sessions,
        }
      })
    }

    const appendRuntimeTrace = (trace: AhipRuntimeTrace) => {
      setState((current) => {
        const existing = current.runtimeTraces[trace.sessionId] ?? []
        persistSafely(persistRuntimeTrace(trace))

        return {
          ...current,
          runtimeTraces: {
            ...current.runtimeTraces,
            [trace.sessionId]: [...existing, trace].slice(-20),
          },
        }
      })
    }

    const replaceAhipItemMessage = (sourceItem: AHIPItem, nextMessage: AhipPreviewMessage) => {
      setState((current) => {
        const sessionId = nextMessage.sessionId
        const existing = current.messages[sessionId] ?? []
        let persistedMessageId = nextMessage.messageId
        const replacedMessages = existing.map((message) => {
          if (message.kind !== 'ahip' || message.item.item_id !== sourceItem.item_id) return message

          persistedMessageId = message.messageId
          return {
            ...nextMessage,
            messageId: message.messageId,
            createdAt: message.createdAt,
          }
        })
        const replaced = replacedMessages.some((message, index) => message !== existing[index])
        const messages = replaced ? replacedMessages : [...existing, nextMessage]
        const finalMessage = messages.find((message) => message.messageId === persistedMessageId) ?? nextMessage
        const sessions = current.sessions.map((session) =>
          session.sessionId === sessionId
            ? {
                ...session,
                updatedAt: nowIso(),
              }
            : session,
        )
        const sessionToPersist = sessions.find((session) => session.sessionId === sessionId)

        persistSafely(replaced ? persistReplaceMessage(persistedMessageId, finalMessage) : persistMessage(nextMessage))
        if (sessionToPersist) persistSafely(persistSession(sessionToPersist))

        return {
          ...current,
          messages: {
            ...current.messages,
            [sessionId]: messages,
          },
          sessions,
        }
      })
    }

    return {
      ...state,
      secrets,
      selectedAgent,
      selectedSession,
      selectedMessages,
      selectedTraces,
      selectedArtifactEvents,
      selectedProviderTest,
      hydrating,
      hydrationError,
      running,
      pipelineStatus,
      longRunningRequest,
      runtimeError,
      createAgent: (input) => {
        const timestamp = nowIso()
        const agent: AhipPreviewAgent = {
          agentId: makePreviewId('agent'),
          name: input.name.trim() || 'Untitled AHIP Agent',
          ...(input.avatar ? { avatar: input.avatar } : {}),
          ...(input.bio?.trim() ? { bio: input.bio.trim() } : {}),
          provider: input.provider,
          baseUrl: input.baseUrl.trim() || 'https://api.openai.com/v1',
          model: input.model.trim() || 'gpt-4.1-mini',
          systemPrompt:
            input.systemPrompt.trim() ||
            'You are a careful AHIP preview agent. Use AHIP only for durable, structured, or actionable interactions.',
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        const session = createSessionRecord(agent.agentId)

        setState((current) => ({
          ...current,
          agents: [agent, ...current.agents],
          sessions: [session, ...current.sessions],
          messages: {
            ...current.messages,
            [session.sessionId]: [],
          },
          selectedAgentId: agent.agentId,
          selectedSessionId: session.sessionId,
        }))
        setSecrets((current) => ({
          apiKeysByAgentId: {
            ...current.apiKeysByAgentId,
            ...(input.apiKey ? { [agent.agentId]: input.apiKey } : {}),
          },
        }))

        persistSafely(persistAgent(agent))
        persistSafely(persistSession(session))
        persistSafely(saveSelection(agent.agentId, session.sessionId))
        if (input.apiKey) persistSafely(persistSecret(agent.agentId, input.apiKey))
      },
      updateAgent: (agentId, patch) => {
        setState((current) => ({
          ...current,
          agents: current.agents.map((agent) => {
            if (agent.agentId !== agentId) return agent
            const nextAgent = {
              ...agent,
              ...patch,
              updatedAt: nowIso(),
            }
            persistSafely(persistAgent(nextAgent))
            return nextAgent
          }),
        }))
      },
      updateAgentApiKey: (agentId, apiKey) => {
        setSecrets((current) => ({
          apiKeysByAgentId: {
            ...current.apiKeysByAgentId,
            [agentId]: apiKey,
          },
        }))

        if (apiKey) {
          persistSafely(persistSecret(agentId, apiKey))
        } else {
          persistSafely(persistDeleteSecret(agentId))
        }
      },
      deleteAgentApiKey: (agentId) => {
        setSecrets((current) => {
          const next = { ...current.apiKeysByAgentId }
          delete next[agentId]
          return { apiKeysByAgentId: next }
        })
        persistSafely(persistDeleteSecret(agentId))
      },
      createSession: (agentId) => {
        const session = createSessionRecord(agentId)

        setState((current) => ({
          ...current,
          sessions: [session, ...current.sessions],
          messages: {
            ...current.messages,
            [session.sessionId]: [],
          },
          selectedAgentId: agentId,
          selectedSessionId: session.sessionId,
        }))

        persistSafely(persistSession(session))
        persistSafely(saveSelection(agentId, session.sessionId))
      },
      selectSession: (sessionId) => {
        const session = state.sessions.find((item) => item.sessionId === sessionId)
        if (!session) return
        setState((current) => ({
          ...current,
          selectedAgentId: session.agentId,
          selectedSessionId: session.sessionId,
        }))
        persistSafely(saveSelection(session.agentId, session.sessionId))
      },
      sendMessage: async (text) => {
        const agent = selectedAgent
        const session = selectedSession
        const content = text.trim()
        if (!agent || !session || !content || running || hydrating) return

        const userMessage: AhipPreviewMessage = {
          messageId: makePreviewId('msg'),
          sessionId: session.sessionId,
          role: 'user',
          kind: 'text',
          text: content,
          createdAt: nowIso(),
        }

        appendMessage(userMessage)
        const abortController = new AbortController()
        activeAbortControllerRef.current = abortController
        setRunning(true)
        setPipelineStatus({
          phase: 'preparing_context',
          label: 'Preparing user message and runtime context.',
          providerActive: false,
          startedAt: nowIso(),
          lastActivityAt: nowIso(),
        })
        setLongRunningRequest(null)
        setRuntimeError(null)

        try {
          const result = await generateAssistantMessage({
            agent,
            apiKey: secrets.apiKeysByAgentId[agent.agentId] ?? '',
            sessionId: session.sessionId,
            userText: content,
            transcript: [...selectedMessages, userMessage],
            abortSignal: abortController.signal,
            onPipelineEvent: handlePipelineEvent,
          })
          if (abortController.signal.aborted) return
          appendMessage(result.message)
          appendRuntimeTrace(result.trace)
        } catch (error) {
          if (abortController.signal.aborted) return
          setRuntimeError(error instanceof Error ? error.message : 'Unknown AHIP runtime error')
        } finally {
          if (activeAbortControllerRef.current === abortController) {
            activeAbortControllerRef.current = null
          }
          clearSoftTimeout()
          setLongRunningRequest(null)
          setPipelineStatus(null)
          setRunning(false)
        }
      },
      dispatchAction: async (action, item) => {
        const agent = selectedAgent
        const session = selectedSession
        if (!agent || !session || running || hydrating) return

        // Route invoke_widget_action to the live iframe widget if one exists
        if (action.kind === 'invoke_widget_action' && typeof action.payload?.widget_id === 'string') {
          const dispatched = dispatchWidgetAction(action.payload.widget_id, action)

          // If the widget action requests an LLM response (e.g., a chess move),
          // forward the action to the LLM as a continuation prompt so it can reply.
          if (action.payload?.requires_llm_response === true) {
            const widgetId = action.payload.widget_id as string
            const interactionId = makePreviewId('widget_interaction')
            const moveDescription =
              typeof action.payload.description === 'string'
                ? action.payload.description
                : `Widget action: ${action.payload.action ?? action.label}`
            const continuationText = [
              `The user performed an action in the "${widgetId}" widget.`,
              `Action: ${moveDescription}`,
              typeof action.payload.move === 'string' ? `Move: ${action.payload.move}` : '',
              action.payload.board_state ? `Current board state:\n${action.payload.board_state}` : '',
              '',
              'Respond with your counter-move. Include an invoke_widget_action in your AHIP response',
              'with the widget_id and your move data in the payload so the host can forward it to the widget.',
              'Also include a markdown block showing the updated game state.',
            ].filter(Boolean).join('\n')

            const userMessage: AhipPreviewMessage = {
              messageId: makePreviewId('msg'),
              sessionId: session.sessionId,
              role: 'user',
              kind: 'text',
              text: moveDescription,
              createdAt: nowIso(),
              metadata: {
                source: 'widget_action',
                widgetId,
                interactionId,
              },
            }

            appendMessage(userMessage)
            const abortController = new AbortController()
            activeAbortControllerRef.current = abortController
            setRunning(true)
            setPipelineStatus({
              phase: 'preparing_context',
              label: 'Processing widget action with LLM...',
              providerActive: false,
              startedAt: nowIso(),
              lastActivityAt: nowIso(),
            })
            setLongRunningRequest(null)
            setRuntimeError(null)

            try {
              const result = await generateAssistantMessage({
                agent,
                apiKey: secrets.apiKeysByAgentId[agent.agentId] ?? '',
                sessionId: session.sessionId,
                userText: continuationText,
                transcript: [...selectedMessages, userMessage],
                abortSignal: abortController.signal,
                onPipelineEvent: handlePipelineEvent,
              })
              if (abortController.signal.aborted) return
              appendMessage({
                ...result.message,
                metadata: {
                  source: 'widget_action',
                  widgetId,
                  interactionId,
                },
              })
              appendRuntimeTrace(result.trace)

              // Forward any invoke_widget_action from LLM response back to the widget
              if (result.message.kind === 'ahip' && result.message.item.actions) {
                for (const responseAction of result.message.item.actions) {
                  if (
                    responseAction.kind === 'invoke_widget_action' &&
                    typeof responseAction.payload?.widget_id === 'string'
                  ) {
                    dispatchWidgetAction(responseAction.payload.widget_id, responseAction)
                  }
                }
              }
            } catch (error) {
              if (abortController.signal.aborted) return
              setRuntimeError(error instanceof Error ? error.message : 'Widget action LLM error')
            } finally {
              if (activeAbortControllerRef.current === abortController) {
                activeAbortControllerRef.current = null
              }
              clearSoftTimeout()
              setLongRunningRequest(null)
              setPipelineStatus(null)
              setRunning(false)
            }
            return
          }

          if (dispatched) return
        }

        // Handle invoke_tool on items with executable tool_intents
        if (action.kind === 'invoke_tool' && item.tool_intents?.length) {
          const executableIntent = item.tool_intents.find(
            (intent) => hasToolHandler(intent.tool_name) && intent.status !== 'completed' && intent.status !== 'failed',
          )
          if (executableIntent) {
            const abortController = new AbortController()
            activeAbortControllerRef.current = abortController
            setRunning(true)
            setPipelineStatus({
              phase: 'tool_execution',
              label: `Preparing tool intent: ${executableIntent.tool_name}.`,
              providerActive: false,
              startedAt: nowIso(),
              lastActivityAt: nowIso(),
            })
            setLongRunningRequest(null)
            setRuntimeError(null)

            try {
              const result = await executeToolIntent({
                intent: executableIntent,
                sourceItem: item,
                agent,
                apiKey: secrets.apiKeysByAgentId[agent.agentId] ?? '',
                sessionId: session.sessionId,
                transcript: selectedMessages,
                abortSignal: abortController.signal,
                onPipelineEvent: handlePipelineEvent,
              })
              if (abortController.signal.aborted) return
              appendMessage(result.statusMessage)
              appendRuntimeTrace(result.trace)
              if (result.followUpMessage) {
                appendMessage(result.followUpMessage)
              }
            } catch (error) {
              if (abortController.signal.aborted) return
              setRuntimeError(error instanceof Error ? error.message : 'Tool execution failed')
            } finally {
              if (activeAbortControllerRef.current === abortController) {
                activeAbortControllerRef.current = null
              }
              clearSoftTimeout()
              setLongRunningRequest(null)
              setPipelineStatus(null)
              setRunning(false)
            }
            return
          }
        }

        const continuationPrompt = getActionContinuationPrompt(action, item)
        if (continuationPrompt) {
          const userMessage: AhipPreviewMessage = {
            messageId: makePreviewId('msg'),
            sessionId: session.sessionId,
            role: 'user',
            kind: 'text',
            text: action.kind === 'reply_with_template' && typeof action.payload?.template === 'string'
              ? action.payload.template
              : action.label,
            createdAt: nowIso(),
          }

          appendMessage(userMessage)
          const abortController = new AbortController()
          activeAbortControllerRef.current = abortController
          setRunning(true)
          setPipelineStatus({
            phase: 'preparing_context',
            label: 'Preparing AHIP action continuation.',
            providerActive: false,
            startedAt: nowIso(),
            lastActivityAt: nowIso(),
          })
          setLongRunningRequest(null)
          setRuntimeError(null)

          try {
            const result = await generateAssistantMessage({
              agent,
              apiKey: secrets.apiKeysByAgentId[agent.agentId] ?? '',
              sessionId: session.sessionId,
              userText: continuationPrompt,
              transcript: [...selectedMessages, userMessage],
              abortSignal: abortController.signal,
              onPipelineEvent: handlePipelineEvent,
            })
            if (abortController.signal.aborted) return
            appendMessage(result.message)
            appendRuntimeTrace({
              ...result.trace,
              actionId: action.id,
            })
          } catch (error) {
            if (abortController.signal.aborted) return
            setRuntimeError(error instanceof Error ? error.message : 'Unknown AHIP runtime error')
          } finally {
            if (activeAbortControllerRef.current === abortController) {
              activeAbortControllerRef.current = null
            }
            clearSoftTimeout()
            setLongRunningRequest(null)
            setPipelineStatus(null)
            setRunning(false)
          }
          return
        }

        const result = handleAhipAction({ action, item, agent })

        if (result.replaceSourceItem) {
          replaceAhipItemMessage(item, result.message)
          appendRuntimeTrace(result.trace)
          return
        }

        appendMessage(result.message)
        appendRuntimeTrace(result.trace)
      },
      continueWaitingForProvider: () => {
        if (!activeAbortControllerRef.current) return
        setLongRunningRequest(null)
        scheduleSoftTimeout(pipelineStatus?.label ?? 'Still waiting for the provider response.')
      },
      cancelRunningRequest: () => {
        activeAbortControllerRef.current?.abort()
        activeAbortControllerRef.current = null
        clearSoftTimeout()
        setLongRunningRequest(null)
        setPipelineStatus(null)
        setRunning(false)
        setRuntimeError('Provider request cancelled.')
      },
      openArtifact: async (artifact, item) => {
        const sessionId = item.session_id ?? selectedSession?.sessionId ?? makePreviewId('session')
        const event: AhipArtifactOpenEvent = {
          eventId: makePreviewId('artifact_event'),
          sessionId,
          itemId: item.item_id,
          artifactId: artifact.artifact_id,
          artifactKind: artifact.kind,
          name: artifact.name,
          uri: artifact.uri,
          openedAt: nowIso(),
        }

        setState((current) => {
          const existing = current.artifactOpenEvents[sessionId] ?? []
          return {
            ...current,
            artifactOpenEvents: {
              ...current.artifactOpenEvents,
              [sessionId]: [...existing, event].slice(-50),
            },
          }
        })
        persistSafely(persistArtifactOpenEvent(event))

        if (selectedAgent) {
          appendRuntimeTrace({
            traceId: makePreviewId('trace'),
            sessionId,
            agentId: selectedAgent.agentId,
            mode: 'local_demo',
            provider: selectedAgent.provider,
            model: selectedAgent.model,
            userText: `artifact:${artifact.artifact_id}`,
            startedAt: event.openedAt,
            finishedAt: nowIso(),
            status: 'ok',
            repairCount: 0,
            validationErrors: [],
            finalMessageKind: 'ahip',
            scenarioId: getScenarioId(item),
            artifactIds: [artifact.artifact_id],
          })
        }

        if (artifact.uri) {
          window.open(artifact.uri, '_blank', 'noopener,noreferrer')
        }
      },
      recordRenderError: (item, message) => {
        const agent = selectedAgent
        const sessionId = item.session_id ?? selectedSession?.sessionId
        if (!agent || !sessionId) return

        appendRuntimeTrace({
          traceId: makePreviewId('trace'),
          sessionId,
          agentId: agent.agentId,
          mode: 'local_demo',
          provider: agent.provider,
          model: agent.model,
          userText: `render_error:${item.item_id}`,
          startedAt: nowIso(),
          finishedAt: nowIso(),
          status: 'failed',
          repairCount: 0,
          validationErrors: [message],
          finalMessageKind: 'ahip',
          error: message,
          scenarioId: getScenarioId(item),
          fallbackUsed: true,
        })
      },
      testProvider: async (agentId) => {
        const agent = state.agents.find((item) => item.agentId === agentId)
        if (!agent || hydrating) return

        const testingState: AhipProviderTest = {
          status: 'testing',
          testedAt: nowIso(),
        }
        setState((current) => ({
          ...current,
          providerTests: {
            ...current.providerTests,
            [agentId]: testingState,
          },
        }))
        persistSafely(persistProviderTest(agentId, testingState))

        try {
          const message = await testProviderDecision({
            agent,
            apiKey: secrets.apiKeysByAgentId[agent.agentId] ?? '',
            skillManifest: getAhipSkillManifest(AHIP_PREVIEW_CAPABILITIES),
          })
          const okState: AhipProviderTest = {
            status: 'ok',
            testedAt: nowIso(),
            message,
          }

          setState((current) => ({
            ...current,
            providerTests: {
              ...current.providerTests,
              [agentId]: okState,
            },
          }))
          persistSafely(persistProviderTest(agentId, okState))
        } catch (error) {
          const failedState: AhipProviderTest = {
            status: 'failed',
            testedAt: nowIso(),
            message: error instanceof Error ? error.message : 'Unknown provider error',
          }

          setState((current) => ({
            ...current,
            providerTests: {
              ...current.providerTests,
              [agentId]: failedState,
            },
          }))
          persistSafely(persistProviderTest(agentId, failedState))
        }
      },
      exportPreviewData: (scope) => exportAhipPreviewData(scope),
      resetPreview: async () => {
        setRuntimeError(null)
        setRunning(false)
        setLongRunningRequest(null)
        setPipelineStatus(null)
        activeAbortControllerRef.current?.abort()
        activeAbortControllerRef.current = null
        clearSoftTimeout()
        const nextState = await resetAhipPreviewDb()
        clearDynamicApplets()
        setState(nextState)
        setSecrets({ apiKeysByAgentId: {} })
      },
    }
  }, [
    hydrating,
    hydrationError,
    running,
    pipelineStatus,
    longRunningRequest,
    runtimeError,
    secrets,
    selectedAgent,
    selectedArtifactEvents,
    selectedMessages,
    selectedProviderTest,
    selectedSession,
    selectedTraces,
    state,
  ])

  return <AhipPreviewContext.Provider value={value}>{children}</AhipPreviewContext.Provider>
}

export function useAhipPreview() {
  const context = useContext(AhipPreviewContext)
  if (!context) {
    throw new Error('useAhipPreview must be used within AhipPreviewProvider')
  }
  return context
}
