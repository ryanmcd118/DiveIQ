import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { DiveLog } from '@prisma/client';

export default async function DashboardPage() {
  // Fetch a few things in parallel for the dashboard
  const [recentDives, totalCount, aggregates] = await Promise.all([
    prisma.diveLog.findMany({
      orderBy: { date: 'desc' },
      take: 3,
    }),
    prisma.diveLog.count(),
    prisma.diveLog.aggregate({
      _sum: { bottomTime: true },
      _max: { maxDepth: true },
    }),
  ]);

  const totalBottomTime = aggregates._sum.bottomTime ?? 0;
  const deepestDive = aggregates._max.maxDepth ?? 0;
  const mostRecentDive: DiveLog | undefined = recentDives[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-6 md:p-10">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              DiveIQ Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Your personal hub for planning dives, logging experiences, and
              eventually tracking gear, certifications, and more.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/plan"
              className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Plan a dive
            </Link>
            <Link
              href="/log"
              className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Log a dive
            </Link>
          </div>
        </header>

        {/* Stats row */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total dives
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {totalCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Logged in your DiveIQ logbook.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total bottom time
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {totalBottomTime}
              <span className="ml-1 text-base font-normal text-slate-300">
                min
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Across all logged dives.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Deepest dive
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {deepestDive}
              <span className="ml-1 text-base font-normal text-slate-300">
                m
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on your current logbook.
            </p>
          </div>
        </section>

        {/* Main grid: recent dive + lists / future sections */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          {/* Left: most recent dive / overview */}
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-lg font-semibold">Most recent dive</h2>
                <Link
                  href="/log"
                  className="text-xs text-cyan-300 hover:text-cyan-200"
                >
                  View full log
                </Link>
              </div>

              {mostRecentDive ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {mostRecentDive.siteName}{' '}
                    <span className="text-slate-400">
                      ({mostRecentDive.region})
                    </span>
                  </p>
                  <p className="text-slate-400 text-xs mb-1">
                    {mostRecentDive.date}
                  </p>
                  <p className="text-slate-200">
                    {mostRecentDive.maxDepth}m · {mostRecentDive.bottomTime}min
                    {mostRecentDive.visibility != null &&
                      ` · ${mostRecentDive.visibility}m vis`}
                    {mostRecentDive.waterTemp != null &&
                      ` · ${mostRecentDive.waterTemp}°C`}
                  </p>
                  {mostRecentDive.buddyName && (
                    <p className="text-slate-400 text-xs">
                      Buddy: {mostRecentDive.buddyName}
                    </p>
                  )}
                  {mostRecentDive.notes && (
                    <p className="text-slate-300 text-xs mt-2 whitespace-pre-line">
                      {mostRecentDive.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No dives logged yet.{' '}
                  <Link href="/log" className="text-cyan-300 hover:text-cyan-200">
                    Log your first dive
                  </Link>{' '}
                  to see it here.
                </p>
              )}
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-lg font-semibold mb-2">Recent dives</h2>
              {recentDives.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Once you start logging dives, the latest few will appear here
                  for a quick snapshot.
                </p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {recentDives.map((dive) => (
                    <li
                      key={dive.id}
                      className="border border-slate-800 rounded-lg p-3 bg-slate-950/40"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">
                          {dive.siteName}{' '}
                          <span className="text-slate-400">
                            ({dive.region})
                          </span>
                        </span>
                        <span className="text-xs text-slate-400">
                          {dive.date}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {dive.maxDepth}m · {dive.bottomTime}min
                      </p>
                      {dive.buddyName && (
                        <p className="text-slate-400 text-xs mt-1">
                          Buddy: {dive.buddyName}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: future modules / shortcuts */}
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-lg font-semibold mb-2">Planning shortcuts</h2>
              <p className="text-sm text-slate-400 mb-3">
                Jump straight into planning your next dive.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/plan"
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-cyan-400 hover:text-cyan-100"
                >
                  Plan a new dive
                </Link>
                <button
                  type="button"
                  className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                  title="Coming soon"
                >
                  🌊 Plan a weekend trip (coming soon)
                </button>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-lg font-semibold mb-2">
                Gear & certifications
              </h2>
              <p className="text-sm text-slate-400 mb-3">
                This space will eventually track your gear service dates,
                certification levels, and training goals.
              </p>
              <p className="text-xs text-slate-500">
                For now, it&apos;s a placeholder to show where those features
                will live in your product story and interviews.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
