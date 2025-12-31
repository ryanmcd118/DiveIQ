import SignUpForm from "@/features/auth/components/SignUpForm";
import cardStyles from "@/styles/components/Card.module.css";
import layoutStyles from "../auth-layout.module.css";

export const metadata = {
  title: "Sign Up | DiveIQ",
  description: "Create your DiveIQ account",
};

export default function SignUpPage() {
  return (
    <div className={cardStyles.elevatedForm}>
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Create Your Account</h1>
        <p className={layoutStyles.subtitle}>
          Start tracking your dives and planning safer adventures
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}
