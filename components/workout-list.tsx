"use client";

import { WorkoutExercise } from "@/lib/workout-store";
import { formatDuration, formatTotalTime } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import { GripVertical, X, Clock, Pause } from "lucide-react";
import { useState, useRef } from "react";

interface WorkoutListProps {
  exercises: WorkoutExercise[];
  onRemove: (order: number) => void;
  onReorder: (exercises: WorkoutExercise[]) => void;
  onRestChange: (order: number, restTime: number) => void;
  totalDuration: number;
  maxDuration: number;
  /** Optional: called when the user edits the sets count for an exercise */
  onSetsChange?: (order: number, sets: number) => void;
  /** Optional: called when the user edits the reps value for an exercise */
  onRepsChange?: (order: number, reps: string) => void;
}

const REST_OPTIONS = [0, 15, 30, 45, 60];

export function WorkoutList({
  exercises,
  onRemove,
  onReorder,
  onRestChange,
  totalDuration,
  maxDuration,
  onSetsChange,
  onRepsChange,
}: WorkoutListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Tracks the intended drop target without triggering reorder until drop
  const pendingDropIndex = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    pendingDropIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
    const dragElement = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(dragElement, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      return;
    }

    // Only update the visual highlight — no reorder yet
    pendingDropIndex.current = index;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === listRef.current) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    pendingDropIndex.current = null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = draggedIndex;
    const to = pendingDropIndex.current;

    if (from !== null && to !== null && from !== to) {
      const reordered = [...exercises];
      const [item] = reordered.splice(from, 1);
      reordered.splice(to, 0, item);
      onReorder(reordered.map((ex, i) => ({ ...ex, order: i })));
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    pendingDropIndex.current = null;
  };

  const remainingTime = maxDuration - totalDuration;
  const progressPercent = Math.min((totalDuration / maxDuration) * 100, 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-foreground">Your Workout</h2>
          <span className="text-sm font-medium text-muted-foreground">
            {formatTotalTime(totalDuration)} / {formatTotalTime(maxDuration)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              progressPercent >= 100 ? "bg-primary" : "bg-primary/70"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {remainingTime > 0
            ? `${formatDuration(remainingTime)} remaining`
            : "Perfect! 30-minute workout complete"}
        </p>
      </div>

      {/* Exercise list */}
      <div 
        ref={listRef}
        className="flex-1 overflow-auto space-y-2 min-h-0"
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Add exercises to build your workout
            </p>
          </div>
        ) : (
          exercises.map((exercise, index) => (
            <div 
              key={`${exercise.id}-${index}`}
              className={cn(
                "transition-all duration-200",
                dragOverIndex === index && draggedIndex !== index && "scale-105"
              )}
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 bg-card p-3 transition-all duration-200 cursor-grab active:cursor-grabbing",
                  draggedIndex === index 
                    ? "opacity-50 scale-95 border-primary/30 bg-primary/5" 
                    : dragOverIndex === index
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border/80"
                )}
              >
                <button className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  <GripVertical className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {exercise.name}
                    </span>
                  </div>
                  {/* Duration is always read-only; sets & reps are editable when callbacks provided */}
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(exercise.duration)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    {onSetsChange ? (
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Sets:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={exercise.sets}
                          onChange={(e) =>
                            onSetsChange(exercise.order, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 px-1 py-0.5 text-xs border border-input rounded bg-background text-foreground text-center"
                        />
                      </label>
                    ) : (
                      <span className="text-xs text-muted-foreground">{exercise.sets} sets</span>
                    )}
                    <span className="text-xs text-muted-foreground">•</span>
                    {onRepsChange ? (
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Reps:</span>
                        <input
                          type="text"
                          value={exercise.reps}
                          onChange={(e) => onRepsChange(exercise.order, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 px-1 py-0.5 text-xs border border-input rounded bg-background text-foreground text-center"
                        />
                      </label>
                    ) : (
                      <span className="text-xs text-muted-foreground">{exercise.reps} reps</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(exercise.order)}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-destructive/20 transition-colors shrink-0"
                  title="Remove exercise"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {/* Rest time selector */}
              {index < exercises.length - 1 && (
                <div className="flex items-center gap-2 py-2 px-4">
                  <Pause className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Rest:</span>
                  <div className="flex gap-1">
                    {REST_OPTIONS.map((time) => (
                      <button
                        key={time}
                        onClick={() => onRestChange(exercise.order, time)}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full transition-colors",
                          exercise.restAfter === time
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                      >
                        {time === 0 ? "0s" : formatDuration(time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
