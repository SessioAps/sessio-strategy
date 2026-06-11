import { redirect } from "next/navigation";

// Folded into the Roadmap's "By time" view.
export default async function TimelineRedirect({
  searchParams,
}: {
  searchParams: Promise<{ zoom?: string }>;
}) {
  const { zoom } = await searchParams;
  redirect(`/roadmap?view=time${zoom ? `&zoom=${zoom}` : ""}`);
}
