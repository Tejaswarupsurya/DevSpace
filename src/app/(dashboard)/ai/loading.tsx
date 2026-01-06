import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AILoading() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex gap-6">
      {/* Conversations Sidebar */}
      <Card className="w-80 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-16 w-3/4 ml-auto" />
              <Skeleton className="h-32 w-5/6" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    </div>
  );
}
