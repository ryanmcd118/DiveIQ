import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { ProfilePageContent } from "@/features/profile/components/ProfilePageContent";

export const metadata: Metadata = {
  title: "Profile | DiveIQ",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return <ProfilePageContent />;
}
