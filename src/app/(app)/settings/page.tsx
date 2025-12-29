import { Metadata } from "next";
import { PlaceholderPage } from "@/features/app/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Settings | DiveIQ",
};

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      subtitle="Coming soon"
      features={[
        "Account preferences and profile",
        "Unit system (Metric/Imperial)",
        "Default tank and gas configurations",
        "Emergency contacts and safety settings",
        "Notification preferences",
      ]}
      primaryAction={{
        href: "/profile",
        label: "Go to Profile",
      }}
      secondaryAction={{
        href: "/dashboard",
        label: "Back to Dashboard",
      }}
    />
  );
}

