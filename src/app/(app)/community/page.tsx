import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Community | DiveIQ",
};

export default function CommunityPage() {
  return (
    <PlaceholderPage
      title="Community"
      subtitle="Coming soon"
      features={[
        "Connect with other divers",
        "Share dive experiences",
        "Find dive buddies",
        "Join dive groups and events",
      ]}
    />
  );
}

