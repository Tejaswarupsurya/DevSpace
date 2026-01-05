"use client";

import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, AlertCircle, Flag } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  tags: string[];
  dueDate: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  LOW: "bg-green-500/10 text-green-700 border-green-200",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  HIGH: "bg-red-500/10 text-red-700 border-red-200",
};

const PRIORITY_ICONS = {
  LOW: Flag,
  MEDIUM: Flag,
  HIGH: AlertCircle,
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const PriorityIcon =
    PRIORITY_ICONS[task.priority as keyof typeof PRIORITY_ICONS];

  const getDueDateColor = () => {
    if (!task.dueDate) return "";
    const dueDate = new Date(task.dueDate);
    if (isPast(dueDate) && !isToday(dueDate)) return "text-red-600";
    if (isToday(dueDate)) return "text-yellow-600";
    return "text-muted-foreground";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "bg-card p-5 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50 cursor-grabbing",
        "hover:border-primary/50"
      )}
    >
      {/* Title */}
      <h4 className="font-medium mb-3 line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs mt-1">
        {/* Due Date */}
        {task.dueDate && (
          <div className={cn("flex items-center gap-1", getDueDateColor())}>
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(task.dueDate), "MMM d")}</span>
          </div>
        )}

        {/* Priority */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md border",
            PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]
          )}
        >
          <PriorityIcon className="w-3 h-3" />
          <span className="font-medium">{task.priority}</span>
        </div>
      </div>
    </div>
  );
}
