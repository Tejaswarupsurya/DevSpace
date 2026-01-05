import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotesEditor } from "@/components/notes/notes-editor";

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { note: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-full">
      <NotesEditor
        initialContent={user.note?.content || ""}
        initialUpdatedAt={user.note?.updatedAt || new Date()}
      />
    </div>
  );
}
