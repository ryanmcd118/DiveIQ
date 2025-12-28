import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Insights | DiveIQ",
};

export default function InsightsPage() {
  return (
    <PlaceholderPage
      title="Insights"
      subtitle="Coming soon"
      features={[
        "Advanced analytics and trends",
        "Dive statistics and patterns",
        "Progress tracking and goals",
        "Personalized recommendations",
      ]}
    />
  );
}

