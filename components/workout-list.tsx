"use client";

import { WorkoutExercise } from "@/lib/workout-store";
import { formatDuration, formatTotalTime } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import { GripVertical, X, Clock, Pause } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface WorkoutListProps {
  exercises: WorkoutExercise[];
  onRemove: (order: number) => void;
  onReorder: (exercises: WorkoutExercise[]) => void;
  onRestChange: (order: number, restTime: number) => void;
  totalDuration: number;
  maxDuration: number;
  onSetsChange?: (order: number, sets: number) => void;
  onRepsChange?: (order: number, reps: string) => void;
  onDurationChange?: (order: number, duration: number) => void;
}

const REST_OPTIONS = [0, 15, 30, 45, 60];

// Represents the visual drop indicator: which item index, and whether the line
// appears above ("before") or below ("after") it.
interface DropIndicator {
  index: number;
  position: "before" | "after";
}

export function WorkoutList({
  exercises,
  onRemove,
  onReorder,
  onRestChange,
  totalDuration,
  maxDuration,
  onSetsChange,
  onRepsChange,
  onDurationChange,
}: WorkoutListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Derive the insertion index from the drop indicator ───────────────────
  const getInsertIndex = (indicator: DropIndicator): number => {
    return indicator.position === "before" ? indicator.index : indicator.index + 1;
  };

  // ── Drag source handlers ─────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";

    // Use the element itself as the drag image, offset to the pointer position
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    e.dataTransfer.setDragImage(el, e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropIndicator(null);
  }, []);

  // ── Drop zone handlers ───────────────────────────────────────────────────
  const resolveIndicator = useCallback(
    (e: React.DragEvent, index: number): DropIndicator => {
      const el = itemRefs.current[index];
      if (el) {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        return { index, position: e.clientY < midY ? "before" : "after" };
      }
      return { index, position: "after" };
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedIndex === null) return;
      setDropIndicator(resolveIndicator(e, index));
    },
    [draggedIndex, resolveIndicator]
  );

  const handleDragLeave = useCallback((e: React.DragEvent, index: number) => {
    // Only clear if the pointer actually left this item (not entering a child)
    const el = itemRefs.current[index];
    if (el && !el.contains(e.relatedTarget as Node)) {
      setDropIndicator((prev) => (prev?.index === index ? null : prev));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedIndex === null || dropIndicator === null) {
        setDraggedIndex(null);
        setDropIndicator(null);
        return;
      }

      const insertAt = getInsertIndex(dropIndicator);
      // Adjust: after removing the dragged item, indices shift by -1 if insertAt > draggedIndex
      const adjustedInsert = insertAt > draggedIndex ? insertAt - 1 : insertAt;

      if (adjustedInsert !== draggedIndex) {
        const reordered = [...exercises];
        const [item] = reordered.splice(draggedIndex, 1);
        reordered.splice(adjustedInsert, 0, item);
        onReorder(reordered.map((ex, i) => ({ ...ex, order: i })));
      }

      setDraggedIndex(null);
      setDropIndicator(null);
    },
    [draggedIndex, dropIndicator, exercises, onReorder]
  );

  // ── Keyboard reorder (↑ / ↓ on the grip handle) ─────────────────────────
  const handleGripKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const targetIndex = e.key === "ArrowUp" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= exercises.length) return;
      const reordered = [...exercises];
      const [item] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, item);
      onReorder(reordered.map((ex, i) => ({ ...ex, order: i })));
    },
    [exercises, onReorder]
  );

  const remainingTime = maxDuration - totalDuration;
  const progressPercent = Math.min((totalDuration / maxDuration) * 100, 100);

  const handleFillTime = () => {
    if (!onDurationChange || exercises.length === 0 || remainingTime <= 0) return;
    const last = exercises[exercises.length - 1];
    onDurationChange(last.order, last.duration + remainingTime);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-foreground">Your Workout</h2>
          <div className="flex items-center gap-2">
            {onDurationChange && exercises.length > 0 && remainingTime > 0 && (
              <button
                onClick={handleFillTime}
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title={`Add ${formatDuration(remainingTime)} to last exercise`}
              >
                Fill Time
              </button>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {formatTotalTime(totalDuration)} / {formatTotalTime(maxDuration)}
            </span>
          </div>
        </div>
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
        className="flex-1 overflow-auto min-h-0"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
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
          <div className="space-y-0">
            {exercises.map((exercise, index) => {
              const isDragging = draggedIndex === index;
              // Show line before this item
              const showLineBefore =
                dropIndicator?.index === index &&
                dropIndicator.position === "before" &&
                draggedIndex !== index &&
                draggedIndex !== index - 1;
              // Show line after this item
              const showLineAfter =
                dropIndicator?.index === index &&
                dropIndicator.position === "after" &&
                draggedIndex !== index &&
                draggedIndex !== index + 1;

              return (
                <div key={`${exercise.id}-${index}`} className="relative">
                  {/* Drop line — above */}
                  <div
                    className={cn(
                      "h-0.5 rounded-full mx-2 mb-1 transition-all duration-100",
                      showLineBefore ? "bg-primary" : "bg-transparent"
                    )}
                  />

                  <div
                    ref={(el) => { itemRefs.current[index] = el; }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={(e) => handleDragLeave(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 bg-card p-3 transition-all duration-150 select-none",
                      isDragging
                        ? "opacity-40 border-primary/30 shadow-none"
                        : "border-border hover:border-border/80 cursor-grab active:cursor-grabbing",
                      dropIndicator?.index === index && !isDragging
                        ? "border-primary/40"
                        : ""
                    )}
                  >
                    {/* Grip handle — also keyboard-navigable */}
                    <button
                      aria-label={`Drag to reorder ${exercise.name}. Use arrow keys to move.`}
                      tabIndex={0}
                      onKeyDown={(e) => handleGripKeyDown(e, index)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
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

                  {/* Drop line — below */}
                  <div
                    className={cn(
                      "h-0.5 rounded-full mx-2 mt-1 transition-all duration-100",
                      showLineAfter ? "bg-primary" : "bg-transparent"
                    )}
                  />

                  {/* Rest time selector */}
                  {index < exercises.length - 1 && (
                    <div className="flex items-center gap-2 py-1.5 px-4">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
