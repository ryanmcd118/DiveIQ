"use client";

import { PublicNavbar } from "./PublicNavbar";
import { HeroSection } from "./HeroSection";
import { FeatureTrio } from "./FeatureTrio";
import { PlannerStub } from "./PlannerStub";
import { GallerySection } from "./GallerySection";
import { BrandStory } from "./BrandStory";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import backgroundStyles from "@/styles/components/Background.module.css";

export function PublicHomePage() {
  return (
    <div className={backgroundStyles.pageGradient}>
      <PublicNavbar />
      <HeroSection />
      <FeatureTrio />
      <PlannerStub />
      <GallerySection />
      <BrandStory />
      <FinalCTA />
      <Footer />
    </div>
  );
}

