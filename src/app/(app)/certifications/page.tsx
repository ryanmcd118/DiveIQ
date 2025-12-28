import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Certifications | DiveIQ",
};

export default function CertificationsPage() {
  return (
    <PlaceholderPage
      title="Certifications"
      subtitle="Coming soon"
      features={[
        "Manage your diving certifications",
        "Track certification dates and expiration",
        "View certification requirements",
        "Plan your next training goals",
      ]}
    />
  );
}

