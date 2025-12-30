import { Metadata } from "next";
import { CertificationsPageContent } from "@/features/certifications/components/CertificationsPageContent";

export const metadata: Metadata = {
  title: "Certifications | DiveIQ",
};

export default function CertificationsPage() {
  return <CertificationsPageContent />;
}

