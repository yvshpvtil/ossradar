import { llmsTxt, textResponse } from "@/lib/llms";

export function GET() {
  return textResponse(llmsTxt());
}
