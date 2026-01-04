"use client";

import { ActivityCalendar } from "react-activity-calendar";

interface ContributionGraphProps {
  data: Array<{
    date: string;
    count: number;
    level: number;
  }>;
}

export function ContributionGraph({ data }: ContributionGraphProps) {
  return (
    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">
        Contribution Activity (Last Year)
      </h3>
      <div className="overflow-x-auto">
        <ActivityCalendar
          data={data}
          blockSize={9}
          blockMargin={3}
          blockRadius={2}
          fontSize={10}
          theme={{
            light: ["#f3f4f6", "#c6e9d4", "#7bc96f", "#239a3b", "#196127"],
            dark: ["#27272a", "#0e4429", "#006d32", "#26a641", "#39d353"],
          }}
          showWeekdayLabels={true}
          labels={{
            totalCount: "{{count}} activities in {{year}}",
          }}
        />
      </div>
    </div>
  );
}
