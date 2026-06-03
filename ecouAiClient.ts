/**
 * ecouAiClient.ts
 *
 * Ecou AI Assistant — TypeScript frontend client
 * ================================================
 *
 * Sends the user's draft to the Go backend and renders
 * AI suggestions in the UI. Does NOT call Gemini directly —
 * all AI logic lives in the Go server.
 *
 * Install:
 *   npm install   (no extra packages needed — uses native fetch)
 *
 * Environment:
 *   Set VITE_API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) in your .env file.
 *   Example: VITE_API_BASE_URL=http://localhost:8080
 */

// =============================================================================
// 1. TYPES — Mirror the Go server's request/response structs exactly.
// =============================================================================

/** Payload the frontend sends to POST /api/ai/suggestions */
export interface SuggestionsRequest {
  userId: string;     // e.g. "usr_8a3f92"
  timestamp: string;  // ISO 8601, e.g. "2026-05-14T10:23:00Z"
  userName: string;   // e.g. "Marcus"
  prompt: string;     // Plain text the user has typed. Empty string = blank screen.
}

/** A single suggestion returned by the AI */
export interface Suggestion {
  text: string;
  intent:
    | "person"
    | "place"
    | "time"
    | "sensory"
    | "relationship"
    | "object"
    | "entity_creation";
}

/** Full response envelope from the Go server */
export interface SuggestionsResponse {
  success: boolean;
  userId: string;
  timestamp: string;
  mode: "empty_field" | "draft_review";
  suggestions: Suggestion[];
  error?: string; // Only present when success === false
}

// =============================================================================
// 2. CONFIG
// =============================================================================

const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8080";

const SUGGESTIONS_ENDPOINT = `${API_BASE_URL}/api/ai/suggestions`;

const REQUEST_TIMEOUT_MS = 10_000; // 10 seconds — AI calls can be slow

// =============================================================================
// 3. THE CLIENT FUNCTION
//    Call this when the user taps the AI button.
// =============================================================================

/**
 * Fetch AI writing suggestions from the Ecou Go backend.
 *
 * @param userId    - The authenticated user's ID (from your auth session)
 * @param userName  - Display name of the user (for server-side logging)
 * @param prompt    - What the user has typed. Pass empty string for blank screen.
 * @returns         - Parsed SuggestionsResponse, or null on unrecoverable failure
 *
 * Usage example:
 *   const result = await fetchSuggestions("usr_abc", "Marcus", draftText);
 *   if (result?.success) renderSuggestions(result.suggestions);
 */
export async function fetchSuggestions(
  userId: string,
  userName: string,
  prompt: string
): Promise<SuggestionsResponse | null> {

  const body: SuggestionsRequest = {
    userId,
    userName,
    prompt,
    timestamp: new Date().toISOString(),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SUGGESTIONS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON regardless of HTTP status — the server always returns JSON
    const data: SuggestionsResponse = await response.json();

    if (!response.ok || !data.success) {
      console.error(
        `[EcouAI] Server error (${response.status}):`,
        data.error ?? "unknown error"
      );
      return null;
    }

    return data;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[EcouAI] Request timed out after", REQUEST_TIMEOUT_MS, "ms");
    } else {
      console.error("[EcouAI] Network error:", err);
    }

    return null;
  }
}

// =============================================================================
// 4. UI HELPERS — Render suggestions and handle the AI button.
//    Adapt these to your component framework (React, Vue, Svelte, etc.)
// =============================================================================

/**
 * Called when the user taps the AI button.
 * Handles both blank-screen (State 1) and draft (State 2) modes.
 *
 * @param userId    - Authenticated user ID
 * @param userName  - User's display name
 * @param draftText - Current value of the text input. Pass "" for blank screen.
 * @param onLoading - Called with true when request starts, false when done
 * @param onResult  - Called with the suggestions to display in the UI
 * @param onError   - Called when the AI is unavailable (hide the button gracefully)
 */
export async function handleAIButtonTap(
  userId: string,
  userName: string,
  draftText: string,
  onLoading: (loading: boolean) => void,
  onResult: (suggestions: Suggestion[], mode: "empty_field" | "draft_review") => void,
  onError: () => void
): Promise<void> {
  onLoading(true);

  const result = await fetchSuggestions(userId, userName, draftText);

  onLoading(false);

  if (!result) {
    // Network failure or server error — hide the AI button silently.
    // Do NOT show an error message that would break the user's flow.
    onError();
    return;
  }

  onResult(result.suggestions, result.mode);
}

// =============================================================================
// 5. REACT HOOK (Optional) — Drop-in for React / Next.js projects.
//    Remove this section if you are not using React.
// =============================================================================

// Uncomment and use in your React component:
//
// import { useState, useCallback } from "react";
//
// export function useEcouAI(userId: string, userName: string) {
//   const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
//   const [mode, setMode] = useState<"empty_field" | "draft_review" | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [aiAvailable, setAiAvailable] = useState(true);
//
//   const requestSuggestions = useCallback(
//     async (draftText: string) => {
//       await handleAIButtonTap(
//         userId,
//         userName,
//         draftText,
//         setLoading,
//         (s, m) => { setSuggestions(s); setMode(m); },
//         () => setAiAvailable(false)
//       );
//     },
//     [userId, userName]
//   );
//
//   return { suggestions, mode, loading, aiAvailable, requestSuggestions };
// }

// =============================================================================
// 6. LOCAL TEST RUNNER
//    Simulates all 3 personas × 2 states against a running Go server.
//    Run: npx ts-node ecouAiClient.ts
// =============================================================================

type TestCase = {
  id: string;
  persona: string;
  state: "blank" | "draft";
  userId: string;
  userName: string;
  prompt: string;
  expectedMode: "empty_field" | "draft_review";
};

const testCases: TestCase[] = [
  {
    id: "TC-01-A",
    persona: "Marcus",
    state: "blank",
    userId: "usr_marcus_001",
    userName: "Marcus",
    prompt: "",
    expectedMode: "empty_field",
  },
  {
    id: "TC-01-B",
    persona: "Marcus",
    state: "draft",
    userId: "usr_marcus_001",
    userName: "Marcus",
    prompt:
      "This is Dad on Lake Norman in 1987. He caught a 6-pound bass. He loved fishing.",
    expectedMode: "draft_review",
  },
  {
    id: "TC-02-A",
    persona: "Roberto",
    state: "blank",
    userId: "usr_roberto_002",
    userName: "Roberto",
    prompt: "",
    expectedMode: "empty_field",
  },
  {
    id: "TC-02-B",
    persona: "Roberto",
    state: "draft",
    userId: "usr_roberto_002",
    userName: "Roberto",
    prompt:
      "Mom's chicken adobo. She never measured anything. Just soy sauce, vinegar, " +
      "garlic, bay leaves, black pepper. She told me you have to smell it to know when it's done.",
    expectedMode: "draft_review",
  },
  {
    id: "TC-03-A",
    persona: "Eleanor",
    state: "blank",
    userId: "usr_eleanor_003",
    userName: "Eleanor",
    prompt: "",
    expectedMode: "empty_field",
  },
  {
    id: "TC-03-B",
    persona: "Eleanor",
    state: "draft",
    userId: "usr_eleanor_003",
    userName: "Eleanor",
    prompt:
      "Oh, I remember our wedding day, it was June 12, 1978, and it rained. " +
      "My mother was so upset because we had the reception in the backyard. " +
      "Bob's brother Ray drove up from Texas, and we hadn't seen him in three years. " +
      "The cake was lemon — I picked lemon because Bob's mother said chocolate would melt in the heat.",
    expectedMode: "draft_review",
  },
];

async function runTests(): Promise<void> {
  console.log(`\nEcou AI — TypeScript test runner`);
  console.log(`Target: ${SUGGESTIONS_ENDPOINT}\n`);

  let passed = 0;

  for (const tc of testCases) {
    const divider = "=".repeat(70);
    console.log(`\n${divider}`);
    console.log(`  ${tc.id}  ·  ${tc.persona}  ·  ${tc.state.toUpperCase()}`);
    console.log(`${divider}`);
    console.log(`Sending: ${JSON.stringify({ userId: tc.userId, userName: tc.userName, prompt: tc.prompt.slice(0, 60) + (tc.prompt.length > 60 ? "..." : "") })}`);

    const result = await fetchSuggestions(tc.userId, tc.userName, tc.prompt);

    if (!result) {
      console.log(`\nResult: ✗ FAIL  (null response — check Go server is running)`);
      continue;
    }

    const modeOk = result.mode === tc.expectedMode;

    console.log(`\nMode: ${result.mode} (expected: ${tc.expectedMode})`);
    for (const s of result.suggestions) {
      console.log(`  · [${s.intent.padEnd(17)}] ${s.text}`);
    }

    if (modeOk) {
      passed++;
      console.log(`\nResult: ✓ PASS`);
    } else {
      console.log(`\nResult: ✗ FAIL  (mode mismatch)`);
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  TOTAL: ${passed}/${testCases.length} passed`);
  console.log(`${"=".repeat(70)}\n`);
}

// Run tests if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  runTests().catch(console.error);
}
