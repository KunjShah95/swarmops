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
    <Card className="glass border-white/[0.06] p-4 group hover:-translate-y-0.5 transition-all duration-300">
      <Tabs defaultValue="plan">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] mb-4 flex flex-wrap h-auto gap-1 p-1 rounded-xl">
          <TabsTrigger value="plan" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 text-xs rounded-lg transition-all duration-300">
            Plan
          </TabsTrigger>
          <TabsTrigger value="orchestrator" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 text-xs rounded-lg transition-all duration-300">
            Issue
          </TabsTrigger>
          <TabsTrigger value="tests" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 text-xs rounded-lg transition-all duration-300">
            Tests
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 text-xs rounded-lg transition-all duration-300">
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
