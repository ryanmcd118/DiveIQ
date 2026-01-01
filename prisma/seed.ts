import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface CertificationSeedData {
  agency: "PADI" | "SSI";
  name: string;
  slug: string;
  levelRank: number;
  category: "core" | "specialty" | "professional";
  badgeImageUrl: string | null;
}

async function main() {
  console.log("🌱 Seeding CertificationDefinition catalog...");

  // Read JSON file
  const jsonPath = join(
    process.cwd(),
    "prisma",
    "seed-data",
    "certifications.json"
  );
  const certificationsData = JSON.parse(
    readFileSync(jsonPath, "utf-8")
  ) as CertificationSeedData[];

  let created = 0;
  let updated = 0;

  for (const cert of certificationsData) {
    // Check if record exists to determine if this will be a create or update
    const existing = await prisma.certificationDefinition.findUnique({
      where: {
        agency_slug: {
          agency: cert.agency,
          slug: cert.slug,
        },
      },
    });

    await prisma.certificationDefinition.upsert({
      where: {
        agency_slug: {
          agency: cert.agency,
          slug: cert.slug,
        },
      },
      update: {
        name: cert.name,
        levelRank: cert.levelRank,
        category: cert.category,
        badgeImageUrl: cert.badgeImageUrl,
        updatedAt: new Date(),
      },
      create: {
        agency: cert.agency,
        name: cert.name,
        slug: cert.slug,
        levelRank: cert.levelRank,
        category: cert.category,
        badgeImageUrl: cert.badgeImageUrl,
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`✅ Seed complete: ${created} created, ${updated} updated`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
