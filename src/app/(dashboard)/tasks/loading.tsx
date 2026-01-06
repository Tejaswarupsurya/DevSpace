import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-3">
              {[1, 2, 3].map((task) => (
                <Skeleton key={task} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
