"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSwarmStore } from "@/store/useSwarmStore";

export function SwarmAnalysisTabs() {
  const messages = useSwarmStore((s) => s.messages);
  const planner = messages.filter((m) => m.agent === "planner").map((m) => m.content);
  const orchestrator = messages
    .filter((m) => m.agent === "orchestrator")
    .map((m) => m.content);
  const security = messages
    .filter((m) => m.type === "security" || m.agent === "security_auditor")
    .map((m) => m.content);
  const tests = messages
    .filter((m) => m.type === "test" || m.agent === "test_runner")
    .map((m) => m.content);

  const join = (arr: string[]) =>
    arr.length ? arr.join("\n\n") : "Waiting for agent output…";

  return (
    <Card className="glass border-white/10 bg-white/5 p-4">
      <Tabs defaultValue="plan">
        <TabsList className="bg-background/50 border border-white/10 mb-4 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="plan" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
            Plan
          </TabsTrigger>
          <TabsTrigger value="orchestrator" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
            Issue
          </TabsTrigger>
          <TabsTrigger value="tests" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
            Tests
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
            Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
          {join(planner)}
        </TabsContent>
        <TabsContent value="orchestrator" className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
          {join(orchestrator)}
        </TabsContent>
        <TabsContent value="tests" className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
          {join(tests)}
        </TabsContent>
        <TabsContent value="security" className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
          {join(security)}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
