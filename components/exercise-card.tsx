"use client";

import { Exercise, formatDuration } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import { Plus, Clock, Flame, Check } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  onAdd: (exercise: Exercise) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

const intensityColors = {
  low: "bg-primary/20 text-primary",
  medium: "bg-accent/20 text-accent",
  high: "bg-destructive/20 text-destructive",
};

const muscleGroupLabels = {
  "full-body": "Full Body",
  "upper-body": "Upper Body",
  "lower-body": "Lower Body",
  core: "Core",
  cardio: "Cardio",
  stretching: "Stretching",
  accessories: "Accessories",
};

export function ExerciseCard({
  exercise,
  onAdd,
  isSelected = false,
  disabled = false,
}: ExerciseCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-4 transition-all duration-200",
        !disabled && !isSelected && "hover:border-primary/50 hover:bg-card/80 cursor-pointer",
        isSelected && "border-primary bg-primary/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && !isSelected && onAdd(exercise)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-balance">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {exercise.description}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && !isSelected) onAdd(exercise);
          }}
          disabled={disabled || isSelected}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-all shrink-0",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground",
            disabled && "pointer-events-none"
          )}
        >
          {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            intensityColors[exercise.intensity]
          )}
        >
          <Flame className="h-3 w-3" />
          {exercise.intensity.charAt(0).toUpperCase() + exercise.intensity.slice(1)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          <Clock className="h-3 w-3" />
          {formatDuration(exercise.duration)}
        </span>
        <span className="text-xs text-muted-foreground">
          {exercise.sets} sets • {typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps} reps`}
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {muscleGroupLabels[exercise.muscleGroup]}
        </span>
      </div>
    </div>
  );
}
