/*
server component - authenticated planner route
*/

import { Metadata } from "next";
import { AuthedPlanPageContent } from "@/features/dive-plan/components/AuthedPlanPageContent";

export const metadata: Metadata = {
  title: "Plan a Dive | DiveIQ",
};

export const dynamic = "force-dynamic";

export default function PlanPage() {
  // This route is in (app) route group, so it automatically gets AppShell (sidebar + logged-in navbar)
  return <AuthedPlanPageContent />;
}
