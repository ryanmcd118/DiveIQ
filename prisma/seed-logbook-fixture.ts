/**
 * Seed a "maxed-out" dive log entry for visual parity verification.
 * Run: npx tsx prisma/seed-logbook-fixture.ts
 *
 * Requires at least one user in the database. Creates a dive with all
 * optional fields populated to verify LogbookForm <-> DiveLogDetail parity.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Canonical values: depths in cm, temps in Cx10, pressure in bar, weight in kg
// 72ft ≈ 2195cm, 15ft ≈ 457cm, 78°F ≈ 259 Cx10, 3100 psi ≈ 214 bar, 12lb ≈ 5.44 kg
async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found. Sign up first, then run this script.");
    process.exit(1);
  }

  const existing = await prisma.diveLog.findFirst({
    where: { userId: user.id, siteName: "Logbook Parity Test (Maxed)" },
  });

  if (existing) {
    console.log("Maxed-out dive already exists. Updating...");
    await prisma.diveLog.update({
      where: { id: existing.id },
      data: maxedOutDiveData(),
    });
    console.log(`✅ Updated dive: ${existing.id}`);
  } else {
    const created = await prisma.diveLog.create({
      data: {
        ...maxedOutDiveData(),
        userId: user.id,
      },
    });
    console.log(`✅ Created maxed-out dive: ${created.id}`);
  }
}

function maxedOutDiveData() {
  return {
    date: "2025-02-15",
    startTime: "09:30",
    diveNumber: 42,
    region: "Roatán, Honduras",
    siteName: "Logbook Parity Test (Maxed)",
    buddyName: "Test Buddy",
    diveTypeTags: JSON.stringify(["Boat", "Reef", "Wreck"]),
    maxDepthCm: 2195, // 72 ft
    bottomTime: 41,
    safetyStopDepthCm: 457, // 15 ft
    safetyStopDurationMin: 3,
    surfaceIntervalMin: 60,
    waterTempCx10: 259, // 78°F
    waterTempBottomCx10: 256, // 77°F
    visibilityCm: 1220, // 40 ft
    current: "Light",
    gasType: "Nitrox",
    fO2: 32,
    tankCylinder: "AL80",
    startPressureBar: 214, // ~3100 psi
    endPressureBar: 62, // ~900 psi
    exposureProtection: "5mm",
    weightUsedKg: 5.44, // 12 lb
    gearNotes: "Borrowed spare mask",
    isTrainingDive: true,
    trainingCourse: "AOW",
    trainingInstructor: "Jane Doe",
    trainingSkills: "Nav, DSMB deployment, deep dive",
    notes: "Test dive for logbook parity. All fields populated.",
  };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
