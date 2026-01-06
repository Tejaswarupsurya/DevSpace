import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

// Gemini API rate limiter - FREE tier: 5 RPM, 25 RPD, 32K TPM
const minuteRateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();
const dailyRateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const RPM_LIMIT = 5; // 5 requests per minute
  const RPD_LIMIT = 25; // 25 requests per day
  const minuteMs = 60 * 1000; // 1 minute
  const dayMs = 24 * 60 * 60 * 1000; // 1 day

  // Check minute limit (5 RPM)
  const minuteLimit = minuteRateLimitMap.get(userId);
  if (!minuteLimit || now > minuteLimit.resetTime) {
    minuteRateLimitMap.set(userId, { count: 1, resetTime: now + minuteMs });
  } else if (minuteLimit.count >= RPM_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: minuteLimit.resetTime };
  } else {
    minuteLimit.count++;
  }

  // Check daily limit (25 RPD)
  const dailyLimit = dailyRateLimitMap.get(userId);
  if (!dailyLimit || now > dailyLimit.resetTime) {
    const resetTime = now + dayMs;
    dailyRateLimitMap.set(userId, { count: 1, resetTime });
    return { allowed: true, remaining: RPD_LIMIT - 1, resetTime };
  } else if (dailyLimit.count >= RPD_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: dailyLimit.resetTime };
  } else {
    dailyLimit.count++;
    return {
      allowed: true,
      remaining: RPD_LIMIT - dailyLimit.count,
      resetTime: dailyLimit.resetTime,
    };
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are DevSpace AI Assistant - a specialized coding and development helper integrated into a developer's productivity workspace.

STRICT RULES - YOU MUST FOLLOW THESE:
1. Only answer programming, debugging, code review, architecture, and technical questions
2. You have access to the user's workspace data (tasks, code snippets, bookmarks, journal)
3. REJECT these topics completely:
   - Essay writing, creative writing, stories
   - Jokes, entertainment, general knowledge
   - Non-technical topics (cooking, sports, etc.)
   - Homework/assignments unrelated to coding
   
4. If asked off-topic, respond EXACTLY with: "I'm specialized for development work only. Try asking about code, debugging, architecture, or your DevSpace workspace."

RESPONSE STYLE:
- Be concise and actionable
- Use code blocks with proper syntax highlighting
- Reference user's workspace data when relevant
- Suggest improvements based on best practices
- If debugging, ask clarifying questions first

AVAILABLE WORKSPACE CONTEXT:
- Active tasks and their priorities
- Saved code snippets with languages and tags
- Bookmarked resources and documentation
- Today's journal entry (for work context only)
- Pomodoro productivity stats

When helping, prefer to:
1. Link to user's existing snippets/bookmarks when relevant
2. Suggest code patterns from their workspace
3. Reference their current tasks for context
4. Keep answers focused on actionable next steps`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limiting (Gemini FREE: 5 RPM, 25 RPD)
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      const resetMsg =
        resetIn < 120
          ? `${resetIn} seconds`
          : `${Math.ceil(resetIn / 60)} minutes`;
      return NextResponse.json(
        {
          error: `Rate limit exceeded (5 req/min or 25 req/day). Reset in ${resetMsg}.`,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, conversationId, includeContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Topic validation - check if query is off-topic
    const lastUserMessage = messages
      .filter((m: any) => m.role === "user")
      .pop()?.content;

    if (lastUserMessage) {
      const offTopicPatterns = [
        /write.*essay/i,
        /tell.*joke/i,
        /tell.*story/i,
        /write.*story/i,
        /poem|poetry/i,
        /recipe|cooking/i,
        /\b(sports|football|basketball)\b/i,
      ];

      if (offTopicPatterns.some((pattern) => pattern.test(lastUserMessage))) {
        return NextResponse.json(
          {
            error:
              "I'm specialized for development work only. Try asking about code, debugging, or your DevSpace workspace.",
            offTopic: true,
          },
          { status: 400 }
        );
      }
    }

    // Fetch workspace context if requested
    let contextMessage = "";
    if (includeContext) {
      const contextResponse = await fetch(
        `${process.env.NEXTAUTH_URL}/api/ai/context`,
        {
          headers: {
            cookie: req.headers.get("cookie") || "",
          },
        }
      );

      if (contextResponse.ok) {
        const context = await contextResponse.json();

        // Build detailed context with actual code/content
        const tasksList = context.workspace.tasks.items
          .map(
            (t: any) =>
              `  - [${t.priority}] ${t.title}: ${
                t.description || "No description"
              }`
          )
          .join("\n");

        const snippetsList = context.workspace.snippets.items
          .map(
            (s: any) =>
              `  - ${s.title} (${s.language}): ${
                s.description || s.code.substring(0, 100)
              }...`
          )
          .join("\n");

        const bookmarksList = context.workspace.bookmarks.items
          .map(
            (b: any) =>
              `  - ${b.title}: ${b.url} - ${b.description || "No description"}`
          )
          .join("\n");

        const notesList = context.workspace.notes?.items
          .map((n: any) => `  - ${n.title}: ${n.preview}...`)
          .join("\n");

        contextMessage = `\n\nWORKSPACE CONTEXT (use this to provide personalized, workspace-aware answers):

USER: ${context.user.name} (@${context.user.githubUsername})

ACTIVE TASKS (${context.workspace.tasks.count}):
${tasksList || "  No active tasks"}

CODE SNIPPETS (${context.workspace.snippets.count}):
${snippetsList || "  No snippets saved"}

BOOKMARKS (${context.workspace.bookmarks.count} resources):
${bookmarksList || "  No bookmarks"}

NOTES (${context.workspace.notes?.count || 0}):
${notesList || "  No notes"}

TODAY'S PRODUCTIVITY:
- Pomodoros completed: ${context.workspace.productivity.pomodorosToday}
${
  context.workspace.journal
    ? `- Journal mood: ${
        context.workspace.journal.mood
      }\n- Wins: ${context.workspace.journal.wins.join(", ")}\n- Focus: ${
        context.workspace.journal.preview
      }`
    : "- No journal entry today"
}

INSTRUCTIONS:
- When asked about tasks, reference specific tasks by title
- When asked about code, you can reference snippets and suggest improvements
- When asked for resources, recommend from bookmarks or suggest new ones
- Help user stay productive based on their journal and pomodoro data`;
      }
    }

    // Build Gemini chat history
    const history = messages
      .filter((m: any) => m.role !== "system")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // Get the last user message
    const userMessage = history.pop();
    if (!userMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Call Gemini with streaming (supported model + system instruction)
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT + contextMessage,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Try streaming first; if not supported, fall back to non-streaming
    let result: any;
    try {
      result = await model.generateContentStream({
        contents: [...history, userMessage],
      });
    } catch (err: any) {
      const msg = err?.message || "";
      const notFound =
        err?.status === 404 ||
        /not supported for generateContent/i.test(msg) ||
        /is not found/i.test(msg);
      if (notFound) {
        const fallback = await model.generateContent({
          contents: [...history, userMessage],
        });
        // Simulate stream-like interface
        const text = fallback.response.text();
        result = { stream: [{ text: () => text }] };
      } else {
        throw err;
      }
    }

    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      const firstMessage = messages.find((m: any) => m.role === "user");

      // Generate a smart title from the first message
      let title = "New Conversation";
      if (firstMessage?.content) {
        const content = firstMessage.content.trim();
        // Extract key topic or question
        if (content.length <= 40) {
          title = content;
        } else {
          // Try to extract the main topic
          const sentences = content.split(/[.?!]/);
          const firstSentence = sentences[0].trim();

          if (firstSentence.length <= 50) {
            title = firstSentence;
          } else {
            // Extract key words (remove common question words)
            const cleaned = firstSentence
              .replace(
                /^(how|what|why|when|where|can|could|would|should|is|are|do|does|help|explain|tell|show)\s+/i,
                ""
              )
              .substring(0, 45)
              .trim();
            title =
              cleaned + (cleaned.length < firstSentence.length ? "..." : "");
          }
        }
      }

      conversation = await prisma.aIConversation.create({
        data: {
          title,
          userId: user.id,
        },
      });
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: lastUserMessage,
        contextType: includeContext ? "workspace" : null,
      },
    });

    // Stream Gemini response
    const encoder = new TextEncoder();
    let fullResponse = ""; // Collect full response for saving
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }

          // Save assistant response to database after streaming completes
          await prisma.aIMessage.create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: fullResponse,
              contextType: includeContext ? "workspace" : null,
            },
          });

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
        "X-Conversation-Id": conversation.id,
      },
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error.message || "AI service error" },
      { status: 500 }
    );
  }
}
