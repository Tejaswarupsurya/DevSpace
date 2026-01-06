/**
 * Environment variable validation
 * Run this at app startup to ensure all required env vars are set
 */
export function validateEnv() {
  const required = [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GEMINI_API_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing
        .map((k) => `  - ${k}`)
        .join("\n")}\n\nCheck your .env file against .env.example`
    );
  }

  console.log("✅ All required environment variables are set");
}

// Validate on import (server-side only)
if (typeof window === "undefined") {
  validateEnv();
}
