import type { RiskLevel } from "@/features/plan/types";

/**
 * Calculate risk level based on dive parameters
 * 
 * Risk factors considered:
 * - Maximum depth (deeper = higher risk)
 * - Bottom time (longer = higher risk)
 * 
 * TODO: Enhance with additional factors:
 * - Experience level
 * - Water temperature
 * - Current conditions
 * - Visibility
 * - Historical data for the site
 */
export function calculateRiskLevel(
  maxDepth: number,
  bottomTime: number
): RiskLevel {
  // High risk conditions
  if (maxDepth > 40 || bottomTime > 50) {
    return "High";
  }

  // Moderate risk conditions
  if (maxDepth > 30 || bottomTime > 40) {
    return "Moderate";
  }

  // Low risk (within recreational limits)
  return "Low";
}

/**
 * Get a human-readable description of the risk level
 */
export function getRiskDescription(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "Low":
      return "This dive is within safe recreational limits.";
    case "Moderate":
      return "This dive requires careful planning and execution.";
    case "High":
      return "This dive approaches or exceeds recommended recreational limits. Consider adjusting parameters or seeking additional training.";
    default:
      return "Unable to assess risk level.";
  }
}

