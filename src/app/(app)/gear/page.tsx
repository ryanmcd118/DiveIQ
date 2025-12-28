import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Gear | DiveIQ",
};

export default function GearPage() {
  return (
    <PlaceholderPage
      title="Gear"
      subtitle="Coming soon"
      features={[
        "Track your dive equipment inventory",
        "Monitor service dates and maintenance schedules",
        "Set primary gear configurations",
        "Track gear usage and dive history",
      ]}
    />
  );
}

