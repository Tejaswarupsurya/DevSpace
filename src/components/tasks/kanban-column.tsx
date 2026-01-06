"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onAddTask,
  onTaskClick,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg p-6 min-h-150 transition-colors",
        isOver && "bg-muted/60 ring-2 ring-primary"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-semibold text-sm">
            {title}
            <span className="ml-2 text-muted-foreground">({tasks.length})</span>
          </h3>
        </div>
        <Button
          onClick={onAddTask}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tasks */}
      <div className="space-y-4 flex-1">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
