"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore, DayOfWeek, WeeklySplitDay } from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Dumbbell, Moon, Play, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_FULL: Record<DayOfWeek, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export default function WeeklySplitPage() {
  const router = useRouter();
  const { weeklySplit, savedWorkouts, updateWeeklySplitDay, resetWeeklySplit, setPendingWorkout } =
    useWorkoutStore();

  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3) as DayOfWeek;

  const handleToggleType = (day: DayOfWeek) => {
    const current = weeklySplit[day];
    if (current.type === "rest") {
      updateWeeklySplitDay(day, { type: "workout", workoutId: undefined });
    } else {
      updateWeeklySplitDay(day, { type: "rest", workoutId: undefined, label: undefined });
    }
  };

  const handleAssignWorkout = (day: DayOfWeek, workoutId: string) => {
    const workout = savedWorkouts.find((w) => w.id === workoutId);
    updateWeeklySplitDay(day, {
      workoutId,
      label: workout?.label || workout?.name,
    });
  };

  const handleClearWorkout = (day: DayOfWeek) => {
    updateWeeklySplitDay(day, { workoutId: undefined });
  };

  const handleSaveLabel = (day: DayOfWeek) => {
    updateWeeklySplitDay(day, { label: labelDraft });
    setEditingDay(null);
    setLabelDraft("");
  };

  const handleStartDay = (day: DayOfWeek) => {
    const slot = weeklySplit[day];
    if (slot.type !== "workout") return;
    const workout = savedWorkouts.find((w) => w.id === slot.workoutId);
    if (!workout) return;
    setPendingWorkout({ exercises: workout.exercises, accessories: workout.accessories ?? [] });
    router.push("/workout");
  };

  const workoutDays = DAYS.filter((d) => weeklySplit[d].type === "workout").length;
  const restDays = DAYS.filter((d) => weeklySplit[d].type === "rest").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Weekly Split</h1>
                <p className="text-xs text-muted-foreground">
                  {workoutDays} workout days · {restDays} rest days
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={resetWeeklySplit}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {DAYS.map((day) => {
          const slot = weeklySplit[day];
          const isRest = slot.type === "rest";
          const isToday = day === today;
          const assignedWorkout = savedWorkouts.find((w) => w.id === slot.workoutId);

          return (
            <Card
              key={day}
              className={cn(
                "transition-all",
                isToday && "ring-2 ring-primary",
                isRest && "opacity-70"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Day label + today badge */}
                  <div className="w-24 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{DAY_FULL[day]}</span>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          Today
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>

                  {/* Type toggle */}
                  <button
                    onClick={() => handleToggleType(day)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0",
                      isRest
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isRest ? (
                      <>
                        <Moon className="h-3.5 w-3.5" />
                        Rest
                      </>
                    ) : (
                      <>
                        <Dumbbell className="h-3.5 w-3.5" />
                        Workout
                      </>
                    )}
                  </button>

                  {/* Workout assignment — only for workout days */}
                  {!isRest && (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {editingDay === day ? (
                        /* Label editor */
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveLabel(day)}
                            placeholder="e.g. Push Day, Leg Day…"
                            className="text-sm h-8"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveLabel(day)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDay(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Saved workout selector */}
                          {savedWorkouts.length > 0 && (
                            <select
                              value={slot.workoutId ?? ""}
                              onChange={(e) =>
                                e.target.value
                                  ? handleAssignWorkout(day, e.target.value)
                                  : handleClearWorkout(day)
                              }
                              className="text-sm border border-input rounded-md px-2 py-1 bg-background text-foreground min-w-0 max-w-[180px]"
                            >
                              <option value="">— Choose workout —</option>
                              {savedWorkouts.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.label || w.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Custom label */}
                          <button
                            onClick={() => {
                              setEditingDay(day);
                              setLabelDraft(slot.label ?? "");
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline truncate max-w-[120px]"
                          >
                            {slot.label && !assignedWorkout ? slot.label : "Add label"}
                          </button>

                          {assignedWorkout && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {assignedWorkout.label || assignedWorkout.name}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isRest && (
                    <div className="flex-1 text-sm text-muted-foreground italic">
                      Recovery day
                    </div>
                  )}

                  {/* Start button — only for workout days with an assigned workout */}
                  {!isRest && slot.workoutId && (
                    <Button size="sm" onClick={() => handleStartDay(day)} className="shrink-0">
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {savedWorkouts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No saved workouts yet.</p>
              <p className="text-xs mt-1">
                Build and save workouts first, then assign them to days here.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/")}>
                Build a Workout
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
