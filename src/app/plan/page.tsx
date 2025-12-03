/*
server component
*/

import { Metadata } from "next";
import { PlanPageContent } from "@/features/plan/components/PlanPageContent";

export const metadata: Metadata = {
  title: "Dive Plan | DiveIQ",
};

export default function PlanPage() {
  return <PlanPageContent />;
}
