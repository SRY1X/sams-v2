import { redirect } from "next/navigation";
import { getMembership } from "@/lib/auth/session";

export default async function DashboardRedirect() {
  const membership = await getMembership();
  if (!membership) redirect("/access");
  redirect(`/${membership.role}`);
}
