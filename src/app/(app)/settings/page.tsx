import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { SettingsPageContent } from "@/features/settings/components/SettingsPageContent";

export const metadata: Metadata = {
  title: "Settings | DiveIQ",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return <SettingsPageContent />;
}

