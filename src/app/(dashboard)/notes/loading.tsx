import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function NotesLoading() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <CardContent className="flex-1 p-6">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
