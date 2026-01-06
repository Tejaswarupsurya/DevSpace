import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SnippetsView from "@/components/snippets/snippets-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SnippetsPage() {
  let session: any = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("auth() failed on SnippetsPage", e);
    return redirect("/login");
  }
  if (!session?.user?.id) {
    return redirect("/login");
  }

  let user: { id: string } | null = null;
  try {
    user = await prisma.user.findUnique({ where: { id: session.user.id } });
  } catch (e) {
    console.error("Failed to fetch user on SnippetsPage", e);
    return redirect("/login");
  }
  if (!user) {
    return redirect("/login");
  }

  // Preload recent snippets server-side
  const snippets = await prisma.snippet.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return <SnippetsView initialSnippets={snippets} />;
}
