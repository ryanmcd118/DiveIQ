import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Trips | DiveIQ",
};

export default function TripsPage() {
  return (
    <PlaceholderPage
      title="Trips"
      subtitle="Coming soon"
      features={[
        "Plan multi-day dive trips",
        "Organize dives by trip",
        "Track trip expenses and logistics",
        "Share trip plans with buddies",
      ]}
    />
  );
}
