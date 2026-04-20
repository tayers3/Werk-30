"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore, ScheduledWorkout } from "@/lib/workout-store";
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isToday,
} from "date-fns";
import { CalendarIcon, Plus, Trash2, Target, ChevronLeft, ChevronRight, Play } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [draggedWorkout, setDraggedWorkout] = useState<ScheduledWorkout | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const { scheduledWorkouts, removeScheduledWorkout, addScheduledWorkout } = useWorkoutStore();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getWorkoutsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return scheduledWorkouts.filter((w) => w.date === dateStr);
  };

  const handlePrevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const handleNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const handleToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const handleStartWorkout = (workout: ScheduledWorkout) => {
    const workoutData = {
      exercises: workout.workoutPlan.exercises,
      accessories: workout.workoutPlan.accessories ?? [],
    };
    const encoded = encodeURIComponent(JSON.stringify(workoutData));
    router.push(`/workout?workout=${encoded}`);
  };

  const handleDragStart = (e: React.DragEvent, workout: ScheduledWorkout) => {
    setDraggedWorkout(workout);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedWorkout || draggedWorkout.date === targetDate) {
      setDraggedWorkout(null);
      return;
    }

    removeScheduledWorkout(draggedWorkout.id);
    addScheduledWorkout(targetDate, draggedWorkout.workoutPlan);
    setDraggedWorkout(null);
  };

  const handleDragEnd = () => {
    setDraggedWorkout(null);
    setDragOverDate(null);
  };

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Workout Calendar</h1>
                <p className="text-xs text-muted-foreground">Schedule and track your workouts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/saved-workouts")}>
                <Target className="h-4 w-4 mr-2" />
                Saved Workouts
              </Button>
              <Button size="sm" onClick={() => router.push("/")}>
                <Plus className="h-4 w-4 mr-2" />
                New Workout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
          <p className="text-xs text-muted-foreground hidden sm:block">Drag workouts to reschedule</p>
        </div>

        {/* Weekly grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayWorkouts = getWorkoutsForDate(day);
            const isDragOver = dragOverDate === dateStr;
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateStr)}
                className={`min-h-[140px] rounded-xl border-2 p-2 flex flex-col transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/10"
                    : today
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                {/* Day header */}
                <div className="mb-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground">{DAYS[day.getDay()]}</p>
                  <p className={`text-lg font-bold ${today ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </p>
                </div>

                {/* Workouts */}
                <div className="flex-1 space-y-1">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, workout)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded-lg p-2 text-xs cursor-grab active:cursor-grabbing transition-all ${
                        workout.completed
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/20 text-primary hover:bg-primary/30"
                      } ${draggedWorkout?.id === workout.id ? "opacity-40" : ""}`}
                    >
                      <p className="font-semibold truncate pr-5 leading-tight">
                        {workout.workoutPlan.name}
                      </p>
                      <p className="text-[10px] opacity-70">
                        {workout.workoutPlan.exercises.length} ex •{" "}
                        {Math.floor(workout.workoutPlan.totalDuration / 60)}m
                      </p>
                      {workout.completed && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1">Done</Badge>
                      )}

                      {/* Hover actions */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                        {!workout.completed && (
                          <button
                            onClick={() => handleStartWorkout(workout)}
                            className="p-0.5 rounded bg-primary/20 hover:bg-primary/40"
                            title="Start workout"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removeScheduledWorkout(workout.id)}
                          className="p-0.5 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drop hint */}
                {isDragOver && (
                  <div className="mt-1 rounded border-2 border-dashed border-primary/40 p-1 text-[10px] text-center text-primary/60">
                    Drop here
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-primary/20" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded border-2 border-primary/40 bg-primary/5" />
            <span>Today</span>
          </div>
        </div>
      </main>
    </div>
  );
}