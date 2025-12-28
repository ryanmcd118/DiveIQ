import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { PublicHomePage } from "@/features/public-home";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function RootPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // If authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // If not authenticated, show public homepage
  return <PublicHomePage />;
}
