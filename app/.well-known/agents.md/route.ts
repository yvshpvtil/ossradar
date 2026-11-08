import { agentsMd, markdownResponse } from "@/lib/agents";

export function GET() {
  return markdownResponse(agentsMd(), "/agents.md");
}
