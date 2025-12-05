# Authentication Setup - DiveIQ

## ✅ What's Been Implemented

### 1. Database Schema

- ✅ User, Account, Session, and VerificationToken models added
- ✅ DiveLog and DivePlan models updated with userId foreign keys
- ✅ Migration created and applied

### 2. Authentication Infrastructure

- ✅ NextAuth.js v5 configured with credentials provider
- ✅ Session management with JWT strategy
- ✅ Password hashing with bcrypt
- ✅ Type definitions for NextAuth

### 3. API Routes

- ✅ `/api/auth/[...nextauth]` - NextAuth handler
- ✅ `/api/auth/signup` - User registration
- ✅ `/api/dive-logs` - Protected (requires auth)
- ✅ `/api/dive-plans` - Protected (requires auth)
- ✅ `/api/dive-plans/preview` - Public (for guest users to try AI feedback)

### 4. UI Components

- ✅ SignIn form and page (`/signin`)
- ✅ SignUp form and page (`/signup`)
- ✅ SignUpPrompt modal (for prompting guests)
- ✅ AuthNav component (shows "Log in / Sign up" or "Hi, [name]")
- ✅ SessionProvider wrapper

### 5. Auth Hooks

- ✅ `useAuth()` hook for client-side auth state and actions

### 6. Data Access

- ✅ Repositories updated to filter by userId
- ✅ All CRUD operations scoped to authenticated users

## 🔧 Final Setup Steps

### 1. Install Missing Package

```bash
npm install @auth/prisma-adapter
```

### 2. Add Environment Variables

Add to your `.env` file:

```env
# NextAuth Secret - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Regenerate Prisma Client

```bash
npx prisma generate
```

## 🎯 User Flows

### For New Users

1. Click "Log in / Sign up" in navbar
2. Click "Sign up" link
3. Enter first name, email, and password
4. Automatically signed in and redirected to dashboard

### For Returning Users

1. Click "Log in / Sign up" in navbar
2. Enter email and password
3. Signed in and redirected to dashboard

### For Guest Users

- Can view most of the app
- Can use `/dive-plans/preview` endpoint to get AI feedback without saving
- Prompted to sign up when trying to save data
- After signup, can save and manage their dive logs and plans

## 🔐 Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT sessions with secure secret
- ✅ Server-side session validation
- ✅ User data scoped to authenticated user
- ✅ Protected API routes
- ✅ CSRF protection (NextAuth built-in)

## 📝 Usage Examples

### Check Authentication in Client Components

```typescript
"use client";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function MyComponent() {
  const { user, isAuthenticated, signOutUser } = useAuth();

  if (!isAuthenticated) {
    return <p>Please sign in</p>;
  }

  return <p>Welcome, {user.name}!</p>;
}
```

### Check Authentication in Server Components / API Routes

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use session.user.id to query user-specific data
  const data = await repository.findMany({ userId: session.user.id });

  return NextResponse.json({ data });
}
```

### Show SignUp Prompt to Guests

```typescript
"use client";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import SignUpPrompt from "@/features/auth/components/SignUpPrompt";

export default function SaveButton() {
  const { isAuthenticated } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleSave = () => {
    if (!isAuthenticated) {
      setShowPrompt(true);
      return;
    }
    // Proceed with save
  };

  return (
    <>
      <button onClick={handleSave}>Save Plan</button>
      {showPrompt && <SignUpPrompt onClose={() => setShowPrompt(false)} />}
    </>
  );
}
```

## 🚀 Future Enhancements

Ready to add OAuth providers? Just update the auth config:

```typescript
// src/features/auth/lib/auth.ts
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

providers: [
  CredentialsProvider({
    /* ... */
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
];
```

## 📁 File Structure

```
src/
├── features/auth/
│   ├── components/
│   │   ├── AuthNav.tsx              # Navbar auth status
│   │   ├── AuthNav.module.css
│   │   ├── SessionProvider.tsx      # NextAuth provider wrapper
│   │   ├── SignInForm.tsx           # Sign in form
│   │   ├── SignUpForm.tsx           # Sign up form
│   │   ├── SignUpPrompt.tsx         # Guest prompt modal
│   │   └── SignUpPrompt.module.css
│   ├── hooks/
│   │   └── useAuth.ts               # Auth hook
│   └── lib/
│       └── auth.ts                  # NextAuth config
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts         # NextAuth handler
│   │       └── signup/
│   │           └── route.ts         # Signup endpoint
│   └── (auth)/
│       ├── signin/
│       │   ├── page.tsx
│       │   └── signin.module.css
│       └── signup/
│           ├── page.tsx
│           └── signup.module.css
└── types/
    └── next-auth.d.ts               # NextAuth type extensions
```

## ✨ What's Changed in Navbar

- **Unauthenticated**: Shows "Log in / Sign up" button on the right
- **Authenticated**: Shows "Hi, [FirstName]" and "Sign out" button
- First name is extracted from the `name` field in the user profile

## 🧪 Testing the Implementation

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Log in / Sign up" in the navbar
4. Create a new account
5. Notice the navbar now shows "Hi, [YourName]"
6. Try creating a dive log or plan - it should save to your account
7. Sign out and sign back in - your data persists!

## 🎉 You're All Set!

Your DiveIQ app now has a complete authentication system that:

- Allows users to create accounts and sign in
- Protects user data (each user only sees their own logs/plans)
- Lets guests explore the app without signing up
- Prompts guests to create an account when they want to save
- Displays a personalized greeting in the navbar
- Is ready for OAuth integration when needed
