/*
server component
*/

import { Metadata } from "next";
import { LogPageContent } from "@/features/log/components/LogPageContent";

export const metadata: Metadata = {
  title: "Dive Log | DiveIQ",
};

export default function LogPage() {
  return <LogPageContent />;
}
