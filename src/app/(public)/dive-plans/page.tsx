/*
server component - public (logged-out) version
Auth-aware: redirects authenticated users to /plan
*/

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { PlanPageContent } from "@/features/dive-plan/components/PlanPageContent";

export const metadata: Metadata = {
  title: "Dive Plan | DiveIQ",
};

export const dynamic = "force-dynamic";

export default async function PublicPlanPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // If authenticated, redirect to the authenticated planner route
  if (userId) {
    redirect("/plan");
  }

  // If not authenticated, show public version (no sidebar, public navbar)
  return <PlanPageContent />;
}

