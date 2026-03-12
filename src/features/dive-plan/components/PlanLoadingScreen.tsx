"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import styles from "./PlanLoadingScreen.module.css";

const FACTS = [
  'SCUBA is actually an acronym! It stands for "Self-Contained Underwater Breathing Apparatus."',
  "Nitrogen narcosis can affect divers as shallow as 30m. Some compare the feeling to one martini per 10 meters of depth.",
  "The deepest recorded scuba dive is 332.35m (1,090ft) by Ahmed Gabr in 2014. His descent took 12 minutes. His ascent took 15 hours.",
  '"The bends" got its nickname in the 1800s when compressed-air tunnel workers surfaced too fast and walked bent over in pain.',
  "A single breath can shift your buoyancy by several pounds: inhale to rise, exhale to sink.",
  "Sound travels 4x faster underwater than in air, which is why it's nearly impossible to tell which direction a noise is coming from on a dive.",
  "Over 80% of Earth's oceans, lakes, and waterways remain unmapped and unexplored.",
  "Your wetsuit loses insulating thickness (and buoyancy!) as you descend, as the neoprene compresses under pressure.",
  "A standard tank holds 77 cubic feet of air at surface pressure. At 30m, that same air is consumed roughly 4x faster than at the surface.",
  "Freshwater diving requires less weight than saltwater. Because seawater is denser, you are more buoyant in the ocean than in a lake or quarry.",
  "At 10m depth, water pressure doubles compared to the surface. Every additional 10m adds another full atmosphere of pressure.",
  "The first open-circuit scuba regulator was developed by Jacques Cousteau and Emile Gagnan in 1943. They called it the Aqua-Lung.",
  "Visibility underwater is not just about water clarity. Your brain also perceives colors differently at depth: reds disappear first, then oranges, then yellows.",
  "Wreck diving is one of the fastest-growing diving specialties worldwide. There are an estimated 3 million shipwrecks on the ocean floor.",
];

const STEPS: Record<"generating" | "saving", string[]> = {
  generating: [
    "Analyzing dive parameters...",
    "Checking seasonal conditions for this region...",
    "Reviewing your diver profile...",
    "Building your briefing...",
  ],
  saving: [
    "Reviewing your updated parameters...",
    "Recalculating conditions...",
    "Updating your briefing...",
  ],
};

let lastFactIndex = -1;

interface PlanLoadingScreenProps {
  mode: "generating" | "saving";
}

export function PlanLoadingScreen({ mode }: PlanLoadingScreenProps) {
  const steps = STEPS[mode];
  const [activeStep, setActiveStep] = useState(0);

  const [fact, setFact] = useState(FACTS[0]);

  useLayoutEffect(() => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * FACTS.length);
    } while (idx === lastFactIndex && FACTS.length > 1);
    lastFactIndex = idx;
    setFact(FACTS[idx]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className={styles.container}>
      <ol className={styles.stepList}>
        {steps.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive = i === activeStep;
          return (
            <li
              key={step}
              className={`${styles.step} ${isCompleted ? styles.stepCompleted : ""} ${isActive ? styles.stepActive : ""}`}
            >
              <span className={styles.indicator}>
                {isCompleted ? (
                  "✓"
                ) : isActive ? (
                  <span className={styles.activeDot} />
                ) : (
                  <span className={styles.pendingCircle} />
                )}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>

      <div className={styles.factCard}>
        <div className={styles.factHeader}>
          <div className={styles.diverWrap}>
            <Image
              src="/diver-loading-logo.png"
              width={80}
              height={50}
              alt=""
              className={styles.diverImage}
            />
            <span className={`${styles.bubble} ${styles.bubble1}`} />
            <span className={`${styles.bubble} ${styles.bubble2}`} />
            <span className={`${styles.bubble} ${styles.bubble3}`} />
            <span className={`${styles.bubble} ${styles.bubble4}`} />
          </div>
          <span className={styles.factLabel}>Did you know?</span>
        </div>
        <p className={styles.factText}>{fact}</p>
      </div>
    </div>
  );
}
