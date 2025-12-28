import { PublicNavbar } from "@/features/public-home/components/PublicNavbar";
import backgroundStyles from "@/styles/components/Background.module.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Public routes: PublicNavbar + no AppShell (no sidebar)
  return (
    <div className={backgroundStyles.pageGradient}>
      <PublicNavbar />
      <main>{children}</main>
    </div>
  );
}

