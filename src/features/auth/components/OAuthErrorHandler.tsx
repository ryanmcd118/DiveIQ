"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Client component to handle OAuth error redirects
 * Checks for NextAuth error query params and redirects to desired format
 */
export default function OAuthErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    // If there's an error param but not the oauth param, it might be an OAuth error
    // NextAuth redirects with error codes like "OAuthSignin", "OAuthCallback", etc.
    if (error && !searchParams.get("oauth")) {
      const oauthErrorCodes = [
        "OAuthSignin",
        "OAuthCallback",
        "OAuthCreateAccount",
        "EmailCreateAccount",
        "Callback",
        "OAuthAccountNotLinked",
      ];

      if (oauthErrorCodes.includes(error)) {
        // Redirect to desired format: /signin?oauth=google&error=1
        router.replace("/signin?oauth=google&error=1");
      }
    }
  }, [searchParams, router]);

  return null;
}
