import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { apiError, apiCreated } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;

    // Per-field validation
    if (!email) {
      return apiError("Email is required", 400);
    }

    if (!password) {
      return apiError("Password is required", 400);
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters", 400);
    }

    const trimmedFirstName = firstName?.trim() || "";
    const trimmedLastName = lastName?.trim() || "";

    if (!trimmedFirstName) {
      return apiError("First name is required", 400);
    }

    if (!trimmedLastName) {
      return apiError("Last name is required", 400);
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return apiError("Invalid email format", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return apiError("User with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with trimmed names and normalized email
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      },
    });

    return apiCreated({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/signup error", error);
    return apiError("Failed to create account", 500);
  }
}
