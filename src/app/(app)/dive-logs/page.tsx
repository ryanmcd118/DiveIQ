import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { LogPageContent } from "@/features/dive-log/components/LogPageContent";
import { authOptions } from "@/features/auth/lib/auth";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";

export const metadata: Metadata = {
  title: "Dive Log | DiveIQ",
};

type LogPageProps = {
  searchParams?: Promise<{ diveId?: string }>;
};

export default async function LogPage({ searchParams }: LogPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const initialSelectedDiveId = params?.diveId ?? null;

  // Preserve existing unauthenticated UX: render in-page sign-in card
  // instead of redirecting to /signin.
  if (!session?.user?.id) {
    return (
      <LogPageContent
        initialEntries={[]}
        initialStats={null}
        initialSelectedDiveId={initialSelectedDiveId}
        isAuthed={false}
      />
    );
  }

  const userId = session.user.id;

  const [entries, stats] = await Promise.all([
    diveLogRepository.findMany({
      orderBy: "date",
      userId,
    }),
    diveLogRepository.getStatistics(userId),
  ]);

  return (
    <LogPageContent
      initialEntries={entries}
      initialStats={stats}
      initialSelectedDiveId={initialSelectedDiveId}
      isAuthed={true}
    />
  );
}
