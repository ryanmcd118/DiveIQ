import SignInForm from "@/features/auth/components/SignInForm";
import cardStyles from "@/styles/components/Card.module.css";
import styles from "./signin.module.css";

export const metadata = {
  title: "Sign In | DiveIQ",
  description: "Sign in to your DiveIQ account",
};

export default function SignInPage() {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={cardStyles.elevatedForm}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>
              Sign in to access your dive logs and plans
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}


