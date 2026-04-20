"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useWorkoutStore,
  calculateTotalDuration,
  generateWorkoutId,
  WorkoutPlan,
} from "@/lib/workout-store";
import { MuscleGroup, formatDuration, formatTotalTime } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Play,
  BookmarkPlus,
  CalendarDays,
  Clock,
  Dumbbell,
  Target,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Derive focus label from dominant muscle group
function getWorkoutFocus(
  exercises: { muscleGroup: MuscleGroup }[],
  accessories: { muscleGroup: MuscleGroup }[]
): string {
  const all = [...exercises, ...accessories];
  if (all.length === 0) return "General";
  const counts: Partial<Record<MuscleGroup, number>> = {};
  for (const ex of all) {
    counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
  }
  const top = (Object.entries(counts) as [MuscleGroup, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0][0];
  const labels: Record<MuscleGroup, string> = {
    "full-body": "Full Body",
    "upper-body": "Upper Body",
    "lower-body": "Lower Body",
    core: "Core",
    cardio: "Cardio",
    stretching: "Flexibility",
    accessories: "Accessories",
  };
  return labels[top] ?? "General";
}

function WorkoutPreviewContent() {
  const router = useRouter();
  const {
    pendingWorkout,
    saveWorkout,
    addScheduledWorkout,
  } = useWorkoutStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workoutLabel, setWorkoutLabel] = useState("");
  const [saved, setSaved] = useState(false);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDates, setScheduleDates] = useState<Date[]>([]);
  const [scheduled, setScheduled] = useState(false);

  if (!pendingWorkout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No workout to preview.</p>
          <Button onClick={() => router.push("/")}>Back to Builder</Button>
        </div>
      </div>
    );
  }

  const { exercises, accessories } = pendingWorkout;
  const totalDuration = calculateTotalDuration(exercises, accessories);
  const focus = getWorkoutFocus(exercises, accessories);
  const totalExercises = exercises.length + accessories.length;

  const buildPlan = (name: string): WorkoutPlan => ({
    id: generateWorkoutId(),
    name,
    exercises,
    accessories,
    totalDuration,
    createdAt: new Date(),
  });

  const handleStartWorkout = () => {
    router.push("/workout");
  };

  const handleSave = () => {
    const name =
      workoutLabel.trim() ||
      `Custom Workout ${new Date().toLocaleDateString()}`;
    saveWorkout(buildPlan(name), name);
    setSaved(true);
    setShowSaveDialog(false);
    setWorkoutLabel("");
  };

  const handleSchedule = () => {
    if (scheduleDates.length === 0) return;
    const name = `Custom Workout ${new Date().toLocaleDateString()}`;
    const plan = buildPlan(name);
    for (const date of scheduleDates) {
      const dateStr = date.toISOString().split("T")[0];
      addScheduledWorkout(dateStr, plan);
    }
    setScheduled(true);
    setShowScheduleDialog(false);
    setScheduleDates([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Workout Preview
              </h1>
              <p className="text-xs text-muted-foreground">
                Review before you start
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Summary card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Your Crafted Workout
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{focus}</Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                  {accessories.length > 0 &&
                    ` + ${accessories.length} accessor${accessories.length !== 1 ? "ies" : "y"}`}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTotalTime(totalDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise list */}
        {exercises.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Main Exercises
            </h3>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div
                  key={`${ex.id}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{ex.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(ex.duration)}
                      </span>
                      <span>{ex.sets} sets</span>
                      <span>{ex.reps} reps</span>
                      {ex.restAfter > 0 && i < exercises.length - 1 && (
                        <span className="text-accent">
                          {formatDuration(ex.restAfter)} rest
                        </span>
                      )}
                    </div>
                    {ex.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ex.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accessories */}
        {accessories.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Accessories
            </h3>
            <div className="space-y-2">
              {accessories.map((ex, i) => (
                <div
                  key={`${ex.id}-acc-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{ex.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(ex.duration)}
                      </span>
                      <span>{ex.sets} sets</span>
                      <span>{ex.reps} reps</span>
                    </div>
                    {ex.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ex.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action buttons */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 sm:flex-none sm:px-10"
              onClick={handleStartWorkout}
            >
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => setShowSaveDialog(true)}
              disabled={saved}
            >
              <BookmarkPlus className="h-5 w-5 mr-2" />
              {saved ? "Saved ✓" : "Save Workout"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => setShowScheduleDialog(true)}
            >
              <CalendarDays className="h-5 w-5 mr-2" />
              {scheduled ? "Scheduled ✓" : "Schedule Workout"}
            </Button>
          </div>
          {saved && (
            <p className="text-sm text-muted-foreground mt-3">
              Workout saved — find it in{" "}
              <button
                className="text-primary underline underline-offset-2"
                onClick={() => router.push("/saved-workouts")}
              >
                Saved Workouts
              </button>
              .
            </p>
          )}
          {scheduled && (
            <p className="text-sm text-muted-foreground mt-3">
              Scheduled — view it on your{" "}
              <button
                className="text-primary underline underline-offset-2"
                onClick={() => router.push("/calendar")}
              >
                calendar
              </button>
              .
            </p>
          )}
        </div>
      </main>

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name (optional)</Label>
              <Input
                id="workout-name"
                placeholder={`Custom Workout ${new Date().toLocaleDateString()}`}
                value={workoutLabel}
                onChange={(e) => setWorkoutLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select one or more dates to add this workout to your calendar.
            </p>
            <Calendar
              mode="multiple"
              selected={scheduleDates}
              onSelect={(dates) => setScheduleDates(dates ?? [])}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
            {scheduleDates.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {scheduleDates.length} date
                {scheduleDates.length !== 1 ? "s" : ""} selected:{" "}
                {scheduleDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) =>
                    d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  )
                  .join(", ")}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowScheduleDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSchedule} disabled={scheduleDates.length === 0}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorkoutPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      }
    >
      <WorkoutPreviewContent />
    </Suspense>
  );
}
