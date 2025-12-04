import Link from "next/link";
import type { DiveLog, DivePlan } from "@prisma/client";
import layoutStyles from "@/styles/components/Layout.module.css";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import navStyles from "@/styles/components/Navigation.module.css";
import listStyles from "@/styles/components/List.module.css";

type Props = {
  recentDives: DiveLog[];
  totalCount: number;
  totalBottomTime: number;
  deepestDive: number;
  recentPlans: DivePlan[];
};

export function DashboardPageContent({
  recentDives,
  totalCount,
  totalBottomTime,
  deepestDive,
  recentPlans,
}: Props) {
  const mostRecentDive: DiveLog | undefined = recentDives[0];

  return (
    <main className={layoutStyles.page}>
      <div className={layoutStyles.pageContent}>
        {/* Header */}
        <header className={layoutStyles.pageHeader}>
          <div>
            <h1 className={layoutStyles.pageTitle}>DiveIQ Dashboard</h1>
            <p className={layoutStyles.pageSubtitle}>
              Your personal hub for planning dives, logging experiences, and
              eventually tracking gear, certifications, and more.
            </p>
          </div>
          <div className={layoutStyles.headerActions}>
            <Link href="/dive-plans" className={buttonStyles.primary}>
              Plan a dive
            </Link>
            <Link href="/dive-logs" className={buttonStyles.secondary}>
              Log a dive
            </Link>
          </div>
        </header>

        {/* Stats row */}
        <section className={layoutStyles.statsGrid}>
          <div className={cardStyles.stat}>
            <p className={cardStyles.statLabel}>Total dives</p>
            <p className={cardStyles.statValue}>{totalCount}</p>
            <p className={cardStyles.statDescription}>
              Logged in your DiveIQ logbook.
            </p>
          </div>

          <div className={cardStyles.stat}>
            <p className={cardStyles.statLabel}>Total bottom time</p>
            <p className={cardStyles.statValue}>
              {totalBottomTime}
              <span className={cardStyles.statUnit}>min</span>
            </p>
            <p className={cardStyles.statDescription}>
              Across all logged dives.
            </p>
          </div>

          <div className={cardStyles.stat}>
            <p className={cardStyles.statLabel}>Deepest dive</p>
            <p className={cardStyles.statValue}>
              {deepestDive}
              <span className={cardStyles.statUnit}>m</span>
            </p>
            <p className={cardStyles.statDescription}>
              Based on your current logbook.
            </p>
          </div>
        </section>

        {/* Main grid: recent dives + planning / gear */}
        <section className={layoutStyles.dashboardGrid}>
          {/* Left: most recent dive + recent dives */}
          <div className={layoutStyles.section}>
            <div className={cardStyles.card}>
              <div className={cardStyles.header}>
                <h2 className={cardStyles.title}>Most recent dive</h2>
                <Link href="/dive-logs" className={navStyles.linkAccentSmall}>
                  View full log
                </Link>
              </div>

              {mostRecentDive ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "var(--font-size-sm)" }}>
                  <p style={{ fontWeight: "var(--font-weight-medium)" }}>
                    {mostRecentDive.siteName}{" "}
                    <span className="text-muted">
                      ({mostRecentDive.region})
                    </span>
                  </p>
                  <p className="caption text-muted">
                    {mostRecentDive.date}
                  </p>
                  <p className={listStyles.diveStats}>
                    {mostRecentDive.maxDepth}m · {mostRecentDive.bottomTime}min
                    {mostRecentDive.visibility != null &&
                      ` · ${mostRecentDive.visibility}m vis`}
                    {mostRecentDive.waterTemp != null &&
                      ` · ${mostRecentDive.waterTemp}°C`}
                  </p>
                  {mostRecentDive.buddyName && (
                    <p className={listStyles.diveMeta}>
                      Buddy: {mostRecentDive.buddyName}
                    </p>
                  )}
                  {mostRecentDive.notes && (
                    <p className={listStyles.diveNotes} style={{ marginTop: "var(--space-2)" }}>
                      {mostRecentDive.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className={listStyles.empty}>
                  No dives logged yet.{" "}
                  <Link href="/dive-logs" className={navStyles.linkAccent}>
                    Log your first dive
                  </Link>{" "}
                  to see it here.
                </p>
              )}
            </div>

            <div className={cardStyles.card}>
              <h2 className={cardStyles.titleWithMargin}>Recent dives</h2>
              {recentDives.length === 0 ? (
                <p className={listStyles.empty}>
                  Once you start logging dives, the latest few will appear here
                  for a quick snapshot.
                </p>
              ) : (
                <ul className={listStyles.listCompact}>
                  {recentDives.map((dive) => (
                    <li key={dive.id} className={cardStyles.listItem}>
                      <div className="flex-between" style={{ gap: "var(--space-2)" }}>
                        <span style={{ fontWeight: "var(--font-weight-medium)" }}>
                          {dive.siteName}{" "}
                          <span className="text-muted">({dive.region})</span>
                        </span>
                        <span className={listStyles.diveDate}>
                          {dive.date}
                        </span>
                      </div>
                      <p className="body-small text-muted">
                        {dive.maxDepth}m · {dive.bottomTime}min
                      </p>
                      {dive.buddyName && (
                        <p className={listStyles.diveMeta} style={{ marginTop: "var(--space-1)" }}>
                          Buddy: {dive.buddyName}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: planning + gear */}
          <div className={layoutStyles.section}>
            <div className={cardStyles.card}>
              <h2 className={cardStyles.titleWithMargin}>Planning shortcuts</h2>
              <p className={listStyles.empty} style={{ marginBottom: "var(--space-3)" }}>
                Jump straight into planning your next dive.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Link href="/dive-plans" className={buttonStyles.ghost}>
                  Plan a new dive
                </Link>
                <button
                  type="button"
                  className={buttonStyles.disabled}
                  title="Coming soon"
                >
                  🌊 Plan a weekend trip (coming soon)
                </button>
              </div>
            </div>

            <div className={cardStyles.card}>
              <h2 className={cardStyles.titleWithMargin}>
                Gear & certifications
              </h2>
              <p className={listStyles.empty} style={{ marginBottom: "var(--space-3)" }}>
                This space will eventually track your gear service dates,
                certification levels, and training goals.
              </p>
              <p className={cardStyles.statDescription}>
                For now, it&apos;s a placeholder to show where those features
                will live in your product story and interviews.
              </p>
            </div>
          </div>
        </section>

        {/* Recent planned dives */}
        <section className={cardStyles.card}>
          <div className={cardStyles.header}>
            <h2 className={cardStyles.title}>Recent planned dives</h2>
            <Link href="/dive-plans" className={navStyles.linkAccentSmall}>
              Open planner
            </Link>
          </div>

          {recentPlans.length === 0 ? (
            <p className={listStyles.empty}>
              Once you start generating AI-assisted dive plans, the latest few
              will appear here with their estimated risk levels.
            </p>
          ) : (
            <ul className={listStyles.listCompact}>
              {recentPlans.map((plan) => (
                <li key={plan.id} className={cardStyles.listItem}>
                  <div className="flex-between" style={{ gap: "var(--space-2)" }}>
                    <span style={{ fontWeight: "var(--font-weight-medium)" }}>
                      {plan.siteName}{" "}
                      <span className="text-muted">({plan.region})</span>
                    </span>
                    <span className={listStyles.diveDate}>{plan.date}</span>
                  </div>
                  <p className="body-small text-muted">
                    {plan.maxDepth}m · {plan.bottomTime}min ·{" "}
                    <span style={{ textTransform: "capitalize" }}>
                      {plan.experienceLevel}
                    </span>
                  </p>
                  <p className={listStyles.planRisk}>
                    Estimated risk:{" "}
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {plan.riskLevel}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
