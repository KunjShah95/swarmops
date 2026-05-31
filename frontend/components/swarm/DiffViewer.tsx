"use client";

import { Card } from "@/components/ui/card";
import { useSwarmStore } from "@/store/useSwarmStore";

interface DiffData {
  diff?: string;
  files_changed?: string[];
  summary?: string;
}

export function DiffViewer() {
  const messages = useSwarmStore((s) => s.messages);
  const codeMessages = messages.filter((m) => m.type === "code");

  if (codeMessages.length === 0) {
    return (
      <Card className="glass border-white/10 p-6">
        <h3 className="font-semibold text-white mb-2">Code Diff</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          Waiting for Code Writer agent…
        </p>
      </Card>
    );
  }

  const latest = codeMessages[codeMessages.length - 1];
  const codeData = latest.data as DiffData | undefined;
  const diff = codeData?.diff || "No diff available";
  const filesChanged = codeData?.files_changed || [];

  return (
    <Card className="glass border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="font-semibold text-white">Code Changes</h3>
        <span className="text-xs text-muted-foreground">
          {filesChanged.length} file{filesChanged.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="p-4 overflow-x-auto max-h-64">
        <pre className="text-xs font-mono">
          {diff.split("\n").map((line, index) => {
            let lineClass = "text-gray-300";
            if (line.startsWith("+")) lineClass = "text-green-400 bg-green-500/10";
            else if (line.startsWith("-")) lineClass = "text-red-400 bg-red-500/10";
            else if (line.startsWith("@@")) lineClass = "text-blue-400";
            return (
              <div key={index} className={`${lineClass} px-2 py-0.5`}>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
      {codeData?.summary && (
        <div className="p-4 border-t border-white/10 text-sm text-muted-foreground">
          <strong className="text-white">Summary:</strong> {codeData.summary}
        </div>
      )}
    </Card>
  );
}
