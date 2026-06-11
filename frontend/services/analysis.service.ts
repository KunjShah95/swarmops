import { Insight } from "@/types";
import { useSwarmStore } from "@/store/useSwarmStore";

export function getInsightsFromRun(): Insight[] {
  const { messages, runStatus, prUrl, tokensUsed, estimatedCost } = useSwarmStore.getState();
  const codeMsg = [...messages].reverse().find((m) => m.type === "code");
  const testMsg = [...messages].reverse().find((m) => m.type === "test");
  const secMsg = [...messages].reverse().find((m) => m.type === "security");

  const testData = testMsg?.data as {
    tests_passed?: number;
    tests_failed?: number;
    success?: boolean;
  } | undefined;
  const secData = secMsg?.data as { passed?: boolean; findings?: unknown[] } | undefined;
  const codeData = codeMsg?.data as { files_changed?: string[] } | undefined;

  const files = codeData?.files_changed?.length ?? 0;
  const passed = testData?.tests_passed ?? 0;
  const failed = testData?.tests_failed ?? 0;

  return [
    {
      id: "1",
      title: "Run Status",
      value: runStatus === "idle" ? "Ready" : runStatus,
      description: "Current swarm execution state",
      color: runStatus === "completed" ? "text-green-400" : "text-primary",
    },
    {
      id: "2",
      title: "Files Changed",
      value: files,
      description: "Modified by Code Writer",
      color: "text-secondary",
    },
    {
      id: "3",
      title: "Tests Passed",
      value: passed,
      trend: failed ? `-${failed} failed` : "OK",
      description: "Automated test validation",
      color: testData?.success ? "text-green-400" : "text-orange-400",
    },
    {
      id: "4",
      title: "Security",
      value: secData ? (secData.passed ? "Clear" : "Issues") : "Pending",
      description: "Security auditor findings",
      color: secData?.passed ? "text-green-400" : "text-red-400",
    },
    {
      id: "5",
      title: "Agent Messages",
      value: messages.length,
      description: "Live swarm conversation events",
      color: "text-accent",
    },
    {
      id: "6",
      title: "Pull Request",
      value: prUrl ? "Opened" : runStatus === "completed" ? "None" : "Pending",
      description: prUrl ? "PR ready for review" : "Awaiting PR Opener",
      color: prUrl ? "text-green-400" : "text-muted-foreground",
    },
    {
      id: "7",
      title: "Tokens Consumed",
      value: tokensUsed,
      description: "Total LLM tokens used",
      color: "text-cyan-400",
    },
    {
      id: "8",
      title: "Estimated Cost",
      value: `$${estimatedCost.toFixed(4)}`,
      description: "LLM pricing estimation",
      color: "text-emerald-400",
    },
  ];
}
