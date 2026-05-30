import { useEffect, useRef } from 'react'
import { agentStore } from '../store/agentStore'

export function useAgentStream(runId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!runId) return

    const { addMessage, updateAgentStatus, setRunStatus, setPrUrl, setError } =
      agentStore.getState()

    // Reset state for new run
    agentStore.getState().reset()

    // Create SSE connection
    const eventSource = new EventSource(`/api/stream/${runId}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.event === 'done') {
          setRunStatus(data.status)
          if (data.pr_url) setPrUrl(data.pr_url)
          if (data.error) setError(data.error)
          eventSource.close()
          return
        }

        if (data.event === 'timeout') {
          setError('Stream timed out')
          eventSource.close()
          return
        }

        // Regular message
        if (data.agent && data.content) {
          addMessage({
            agent: data.agent,
            content: data.content,
            type: data.type || 'status',
            timestamp: new Date(),
            sequence: data.sequence,
          })

          updateAgentStatus(data.agent, 'speaking')
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      setError('Connection error')
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close()
      }
    }
  }, [runId])

  return eventSourceRef
}
