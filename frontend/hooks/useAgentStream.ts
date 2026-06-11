"use client";

import { useEffect, useRef } from "react";
import { useSwarmStore } from "@/store/useSwarmStore";

export function useAgentStream(runId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!runId) return;

    const {
      addMessage,
      updateAgentStatus,
      setRunStatus,
      setPrUrl,
      setError,
      reset,
      setTokensUsed,
      setEstimatedCost,
    } = useSwarmStore.getState();

    reset();
    useSwarmStore.setState({ runId });

    const eventSource = new EventSource(`/api/stream/${runId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.tokens_used !== undefined) {
          setTokensUsed(data.tokens_used);
        }
        if (data.estimated_cost !== undefined) {
          setEstimatedCost(data.estimated_cost);
        }

        if (data.event === "done") {
          setRunStatus(data.status);
          if (data.pr_url) setPrUrl(data.pr_url);
          if (data.error) setError(data.error);
          eventSource.close();
          return;
        }

        if (data.event === "timeout") {
          setError("Stream timed out");
          eventSource.close();
          return;
        }

        if (data.event === "status") {
          updateAgentStatus(data.agent, data.status);
          return;
        }

        if (data.agent && data.content) {
          addMessage({
            agent: data.agent,
            content: data.content,
            type: data.type || "status",
            timestamp: new Date(),
            sequence: data.sequence,
            data: data.data || undefined,
          });
          updateAgentStatus(data.agent, "speaking");
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      setError("Connection error");
      eventSource.close();
    };

    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [runId]);

  return eventSourceRef;
}
