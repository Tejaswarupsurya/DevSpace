export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          DevSpace
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Your personal developer productivity dashboard
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>✅ Next.js 16</span>
          <span>✅ TypeScript</span>
          <span>✅ Prisma</span>
          <span>✅ Supabase</span>
        </div>
        <p className="text-sm text-muted-foreground pt-4">
          Ready to build! Start with authentication tomorrow 🚀
        </p>
      </div>
    </div>
  );
}
