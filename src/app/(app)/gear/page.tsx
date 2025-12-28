import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { GearPageContent } from "@/features/gear/components/GearPageContent";

export const metadata: Metadata = {
  title: "Gear | DiveIQ",
};

export default async function GearPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  return <GearPageContent />;
}
