export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Public routes: no AppShell, just render children
  return <>{children}</>;
}

