import { redirect } from "next/navigation";

// Folded into the Roadmap's "By time" view (week zoom).
export default function CalendarRedirect() {
  redirect("/roadmap?view=time&zoom=week");
}
