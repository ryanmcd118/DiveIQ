import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Dive Sites | DiveIQ",
};

export default function SitesPage() {
  return (
    <PlaceholderPage
      title="Dive Sites"
      subtitle="Coming soon"
      features={[
        "Browse and discover dive sites",
        "Save your favorite locations",
        "View site details, conditions, and ratings",
        "Plan dives at specific sites",
      ]}
    />
  );
}

