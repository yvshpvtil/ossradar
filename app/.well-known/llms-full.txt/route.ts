import { llmsFullTxt, textResponse } from "@/lib/llms";

export function GET() {
  return textResponse(llmsFullTxt());
}
