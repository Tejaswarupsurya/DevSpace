"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="text-center max-w-2xl">
        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-[120px] md:text-[180px] font-bold text-zinc-900 leading-none">
            404
          </h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-semibold text-zinc-900 mb-4">
          Page not found
        </h2>
        <p className="text-lg text-zinc-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Button asChild size="lg" className="bg-zinc-900 hover:bg-zinc-800">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t">
          <p className="text-sm text-zinc-600 mb-4">Quick links:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/tasks"
              className="px-4 py-2 text-sm rounded-lg border hover:bg-zinc-50 transition-colors"
            >
              Tasks
            </Link>
            <Link
              href="/snippets"
              className="px-4 py-2 text-sm rounded-lg border hover:bg-zinc-50 transition-colors"
            >
              Snippets
            </Link>
            <Link
              href="/journal"
              className="px-4 py-2 text-sm rounded-lg border hover:bg-zinc-50 transition-colors"
            >
              Journal
            </Link>
            <Link
              href="/ai"
              className="px-4 py-2 text-sm rounded-lg border hover:bg-zinc-50 transition-colors"
            >
              AI Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
