import { AppShell } from "@/features/app/components/AppShell";
import "@/styles/app-theme.css";
import styles from "./app-layout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Authenticated app routes: wrap with AppShell (Sidebar + TopBar)
  // Apply premium app canvas background
  return (
    <div className={styles.appBackground}>
      <AppShell>{children}</AppShell>
    </div>
  );
}
