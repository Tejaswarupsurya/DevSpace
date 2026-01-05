"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durations: {
    work: number;
    break: number;
    longBreak: number;
  };
  onSave: (durations: {
    work: number;
    break: number;
    longBreak: number;
  }) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  durations,
  onSave,
}: SettingsDialogProps) {
  const [workMinutes, setWorkMinutes] = useState(
    Math.floor(durations.work / 60)
  );
  const [breakMinutes, setBreakMinutes] = useState(
    Math.floor(durations.break / 60)
  );
  const [longBreakMinutes, setLongBreakMinutes] = useState(
    Math.floor(durations.longBreak / 60)
  );

  const handleSave = () => {
    onSave({
      work: workMinutes * 60,
      break: breakMinutes * 60,
      longBreak: longBreakMinutes * 60,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="work">Work Duration (minutes)</Label>
            <Input
              id="work"
              type="number"
              min="1"
              max="60"
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="break">Short Break (minutes)</Label>
            <Input
              id="break"
              type="number"
              min="1"
              max="30"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreak">Long Break (minutes)</Label>
            <Input
              id="longBreak"
              type="number"
              min="1"
              max="60"
              value={longBreakMinutes}
              onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
