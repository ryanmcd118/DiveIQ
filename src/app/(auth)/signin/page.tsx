import { Suspense } from "react";
import SignInForm from "@/features/auth/components/SignInForm";
import OAuthErrorHandler from "@/features/auth/components/OAuthErrorHandler";
import cardStyles from "@/styles/components/Card.module.css";
import layoutStyles from "../auth-layout.module.css";

export const metadata = {
  title: "Sign In | DiveIQ",
  description: "Sign in to your DiveIQ account",
};

export default function SignInPage() {
  return (
    <>
      <Suspense fallback={null}>
        <OAuthErrorHandler />
      </Suspense>
      <div className={cardStyles.elevatedForm}>
        <div className={layoutStyles.header}>
          <h1 className={layoutStyles.title}>Welcome Back</h1>
          <p className={layoutStyles.subtitle}>
            Sign in to access your dive logs and plans
          </p>
        </div>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </>
  );
}


