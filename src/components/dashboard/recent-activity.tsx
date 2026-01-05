import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitCommit,
  GitPullRequest,
  Star,
  GitFork,
  GitBranch,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  type: string;
  repo: string;
  action: string;
  createdAt: Date;
  url: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "PushEvent":
        return <GitCommit className="w-4 h-4 text-green-600" />;
      case "PullRequestEvent":
        return <GitPullRequest className="w-4 h-4 text-purple-600" />;
      case "WatchEvent":
        return <Star className="w-4 h-4 text-yellow-600" />;
      case "ForkEvent":
        return <GitFork className="w-4 h-4 text-blue-600" />;
      default:
        return <GitBranch className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {/* Show ~3 items visible, scroll for more */}
        <div className="space-y-3 max-h-70 overflow-y-auto pr-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity found
            </p>
          ) : (
            activities.map((activity, index) => (
              <a
                key={index}
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors block"
              >
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(activity.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </a>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
