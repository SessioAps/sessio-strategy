import { redirect } from "next/navigation";

// The pipeline lives inside the B2B sector now.
export default function PipelineRedirect() {
  redirect("/division/b2b");
}
