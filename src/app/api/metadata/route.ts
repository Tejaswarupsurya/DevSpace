import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    try {
      // Try direct fetch first
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      const html = await response.text();

      // Check for Cloudflare
      if (html.includes("Just a moment") || html.includes("cloudflare")) {
        throw new Error("Blocked by Cloudflare");
      }

      // Extract metadata
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const ogTitleMatch = html.match(
        /<meta property="og:title" content="(.*?)"/i
      );
      const ogDescMatch = html.match(
        /<meta property="og:description" content="(.*?)"/i
      );
      const ogImageMatch = html.match(
        /<meta property="og:image" content="(.*?)"/i
      );
      const descMatch = html.match(/<meta name="description" content="(.*?)"/i);

      return NextResponse.json({
        title: ogTitleMatch?.[1] || titleMatch?.[1] || domain,
        description: ogDescMatch?.[1] || descMatch?.[1] || "",
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        imageUrl: ogImageMatch?.[1] || null,
      });
    } catch (error) {
      // Fallback: Return basic info based on URL
      console.log("Direct fetch failed, using fallback");

      return NextResponse.json({
        title: domain.replace("www.", ""),
        description: `Link from ${domain}`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        imageUrl: null,
      });
    }
  } catch (error) {
    console.error("Error in metadata route:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
