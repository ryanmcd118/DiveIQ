import { AppShell } from "@/features/app/components/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authenticated app routes: wrap with AppShell (Sidebar + TopBar)
  return <AppShell>{children}</AppShell>;
}

