import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Code2,
  CheckSquare,
  Timer,
  Sparkles,
  BookOpen,
  Bookmark,
  Github,
} from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-1 bg-zinc-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">DevSpace</span>
          </div>

          <div className="space-y-8 max-w-md">
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Your Developer Workspace
              </h2>
              <p className="text-zinc-400 text-lg">
                All your productivity tools in one place. Tasks, code snippets,
                journal, and more.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                </div>
                <span>Kanban board to organize your tasks</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 text-blue-500" />
                </div>
                <span>Save and manage code snippets</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <span>AI-powered coding assistant</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Timer className="w-4 h-4 text-blue-500" />
                </div>
                <span>Pomodoro timer for focused work</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <span>Daily journal with mood tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-zinc-500 text-sm">
          Built for developers who value productivity
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">DevSpace</span>
            </div>
            <p className="text-center text-muted-foreground">
              Your developer productivity hub
            </p>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8">
              Sign in with GitHub to continue
            </p>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white"
                size="lg"
              >
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our{" "}
              <span className="underline">Terms of Service</span> and{" "}
              <span className="underline">Privacy Policy</span>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-12 pt-8 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">Free</div>
                <div className="text-xs text-muted-foreground">Forever</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Secure</div>
                <div className="text-xs text-muted-foreground">OAuth 2.0</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Fast</div>
                <div className="text-xs text-muted-foreground">Always</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
