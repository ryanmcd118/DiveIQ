"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signInUser = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setIsLoading(false);
        return { success: false, error: result.error };
      }

      router.push("/");
      router.refresh();
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signUpUser = async (
    email: string,
    password: string,
    name: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        return { success: false, error: data.error };
      }

      // Auto sign in after successful signup
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setIsLoading(false);
        return {
          success: false,
          error: "Account created but failed to sign in",
        };
      }

      router.push("/");
      router.refresh();
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signOutUser = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading" || isLoading,
    signInUser,
    signUpUser,
    signOutUser,
  };
}

