/*
server component - public (logged-out) version
*/

import { Metadata } from "next";
import { PlanPageContent } from "@/features/dive-plan/components/PlanPageContent";

export const metadata: Metadata = {
  title: "Dive Plan | DiveIQ",
};

export default function PublicPlanPage() {
  return <PlanPageContent />;
}

