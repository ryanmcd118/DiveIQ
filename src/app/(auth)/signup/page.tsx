import SignUpForm from "@/features/auth/components/SignUpForm";
import cardStyles from "@/styles/components/Card.module.css";
import styles from "./signup.module.css";

export const metadata = {
  title: "Sign Up | DiveIQ",
  description: "Create your DiveIQ account",
};

export default function SignUpPage() {
  return (
    <div className={styles.container}>
      <div className={`${cardStyles.card} ${styles.authCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Account</h1>
          <p className={styles.subtitle}>
            Start tracking your dives and planning safer adventures
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}


