"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useWorkoutStore,
  calculateTotalDuration,
  generateWorkoutId,
  WorkoutPlan,
  WorkoutExercise,
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
  Link2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---- helpers ----------------------------------------------------------------

function getWorkoutFocus(
  exercises: { muscleGroup: MuscleGroup }[],
  accessories: { muscleGroup: MuscleGroup }[]
): string {
  const all = [...exercises, ...accessories];
  if (all.length === 0) return "General";
  const counts: Partial<Record<MuscleGroup, number>> = {};
  for (const ex of all) counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
  const top = (Object.entries(counts) as [MuscleGroup, number][]).sort((a, b) => b[1] - a[1])[0][0];
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

// ---- Inline inputs ----------------------------------------------------------

function SetsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-14">
      <span className="text-xs text-muted-foreground">Sets</span>
      <input
        type="number"
        min={1}
        max={10}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.max(1, v));
        }}
        className="w-full text-center rounded-md border border-input bg-background px-1 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function RepsInput({ value, onChange }: { value: string | number; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-20">
      <span className="text-xs text-muted-foreground">Reps</span>
      <input
        type="text"
        value={typeof value === "string" ? value : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-center rounded-md border border-input bg-background px-1 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// ---- Accessory row ----------------------------------------------------------

interface AccessoryRowProps {
  acc: WorkoutExercise;
  mainExercises: WorkoutExercise[];
  onChangeSets: (order: number, sets: number) => void;
  onChangeReps: (order: number, reps: string) => void;
  onAssign: (accOrder: number, parentId: string | null) => void;
}

function AccessoryRow({ acc, mainExercises, onChangeSets, onChangeReps, onAssign }: AccessoryRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 ml-6">
      <Link2 className="h-3.5 w-3.5 text-primary/60 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{acc.name}</p>
        {acc.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{acc.description}</p>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Clock className="h-3 w-3" />
          {formatDuration(acc.duration)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span className="text-xs text-muted-foreground">Paired to</span>
        <select
          value={acc.parentExerciseId ?? ""}
          onChange={(e) => onAssign(acc.order, e.target.value || null)}
          className="text-xs border border-input rounded-md px-1.5 py-1 bg-background text-foreground max-w-[130px]"
        >
          <option value="">— Unassigned —</option>
          {mainExercises.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <SetsInput value={acc.sets} onChange={(v) => onChangeSets(acc.order, v)} />
      <RepsInput value={acc.reps} onChange={(v) => onChangeReps(acc.order, v)} />
    </div>
  );
}

// ---- Main exercise row + paired accessories ---------------------------------

interface MainExerciseRowProps {
  exercise: WorkoutExercise;
  index: number;
  pairedAccessories: WorkoutExercise[];
  allMainExercises: WorkoutExercise[];
  onChangeSets: (order: number, sets: number) => void;
  onChangeReps: (order: number, reps: string) => void;
  onChangeAccSets: (order: number, sets: number) => void;
  onChangeAccReps: (order: number, reps: string) => void;
  onAssignAccessory: (accOrder: number, parentId: string | null) => void;
}

function MainExerciseRow({
  exercise: ex,
  index,
  pairedAccessories,
  allMainExercises,
  onChangeSets,
  onChangeReps,
  onChangeAccSets,
  onChangeAccReps,
  onAssignAccessory,
}: MainExerciseRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{ex.name}</p>
          {ex.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ex.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(ex.duration)}
            </span>
            {pairedAccessories.length > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary/30 text-primary">
                {pairedAccessories.length} paired
              </Badge>
            )}
          </div>
        </div>
        <SetsInput value={ex.sets} onChange={(v) => onChangeSets(ex.order, v)} />
        <RepsInput value={ex.reps} onChange={(v) => onChangeReps(ex.order, v)} />
      </div>

      {pairedAccessories.map((acc) => (
        <AccessoryRow
          key={`acc-${acc.order}`}
          acc={acc}
          mainExercises={allMainExercises}
          onChangeSets={onChangeAccSets}
          onChangeReps={onChangeAccReps}
          onAssign={onAssignAccessory}
        />
      ))}
    </div>
  );
}

// ---- Page -------------------------------------------------------------------

function WorkoutPreviewContent() {
  const router = useRouter();
  const { pendingWorkout, setPendingWorkout, saveWorkout, addScheduledWorkout } = useWorkoutStore();

  const [localExercises, setLocalExercises] = useState<WorkoutExercise[]>(
    () => pendingWorkout?.exercises ?? []
  );
  const [localAccessories, setLocalAccessories] = useState<WorkoutExercise[]>(
    () => pendingWorkout?.accessories ?? []
  );

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workoutLabel, setWorkoutLabel] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDates, setScheduleDates] = useState<Date[]>([]);
  const [scheduled, setScheduled] = useState(false);

  const syncPending = useCallback(
    (exs: WorkoutExercise[], accs: WorkoutExercise[]) =>
      setPendingWorkout({ exercises: exs, accessories: accs }),
    [setPendingWorkout]
  );

  const handleChangeSets = (order: number, sets: number) => {
    const u = localExercises.map((e) => (e.order === order ? { ...e, sets } : e));
    setLocalExercises(u);
    syncPending(u, localAccessories);
  };
  const handleChangeReps = (order: number, reps: string) => {
    const u = localExercises.map((e) => (e.order === order ? { ...e, reps } : e));
    setLocalExercises(u);
    syncPending(u, localAccessories);
  };
  const handleChangeAccSets = (order: number, sets: number) => {
    const u = localAccessories.map((e) => (e.order === order ? { ...e, sets } : e));
    setLocalAccessories(u);
    syncPending(localExercises, u);
  };
  const handleChangeAccReps = (order: number, reps: string) => {
    const u = localAccessories.map((e) => (e.order === order ? { ...e, reps } : e));
    setLocalAccessories(u);
    syncPending(localExercises, u);
  };
  const handleAssignAccessory = (accOrder: number, parentId: string | null) => {
    const u = localAccessories.map((e) =>
      e.order === accOrder ? { ...e, parentExerciseId: parentId } : e
    );
    setLocalAccessories(u);
    syncPending(localExercises, u);
  };

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

  const totalDuration = calculateTotalDuration(localExercises, localAccessories);
  const focus = getWorkoutFocus(localExercises, localAccessories);

  // Group accessories by parentExerciseId
  const pairedMap = new Map<string, WorkoutExercise[]>();
  const unassignedAccessories: WorkoutExercise[] = [];
  for (const acc of localAccessories) {
    const pid = acc.parentExerciseId;
    if (pid) {
      const list = pairedMap.get(pid) ?? [];
      list.push(acc);
      pairedMap.set(pid, list);
    } else {
      unassignedAccessories.push(acc);
    }
  }

  const buildPlan = (name: string, id?: string): WorkoutPlan => ({
    id: id ?? generateWorkoutId(),
    name,
    exercises: localExercises,
    accessories: localAccessories,
    totalDuration,
    createdAt: new Date(),
  });

  const handleStartWorkout = () => router.push("/workout");

  const handleSave = () => {
    const name = workoutLabel.trim() || `Custom Workout ${new Date().toLocaleDateString()}`;
    const id = savedId ?? generateWorkoutId();
    const store = useWorkoutStore.getState();
    if (savedId) {
      store.updateSavedWorkout(savedId, {
        exercises: localExercises,
        accessories: localAccessories,
        totalDuration,
        label: name,
        name,
      });
    } else {
      store.saveWorkout(buildPlan(name, id), name);
      setSavedId(id);
    }
    setSaved(true);
    setShowSaveDialog(false);
    setWorkoutLabel("");
  };

  const handleSchedule = () => {
    if (scheduleDates.length === 0) return;
    const name = `Custom Workout ${new Date().toLocaleDateString()}`;
    const plan = buildPlan(name);
    for (const date of scheduleDates) {
      addScheduledWorkout(date.toISOString().split("T")[0], plan);
    }
    setScheduled(true);
    setShowScheduleDialog(false);
    setScheduleDates([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Your Workout</h1>
            <p className="text-xs text-muted-foreground">Edit sets, reps &amp; pair accessories</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Your Crafted Workout</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{focus}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Dumbbell className="h-3.5 w-3.5" />
              {localExercises.length} exercise{localExercises.length !== 1 ? "s" : ""}
              {localAccessories.length > 0 &&
                ` + ${localAccessories.length} accessor${localAccessories.length !== 1 ? "ies" : "y"}`}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatTotalTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* Main exercises + paired accessories */}
        {localExercises.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-1">Main Exercises</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Accessories are shown indented under the exercise they are paired to.
            </p>
            <div className="space-y-4">
              {localExercises.map((ex, i) => (
                <MainExerciseRow
                  key={`${ex.id}-${i}`}
                  exercise={ex}
                  index={i}
                  pairedAccessories={pairedMap.get(ex.id) ?? []}
                  allMainExercises={localExercises}
                  onChangeSets={handleChangeSets}
                  onChangeReps={handleChangeReps}
                  onChangeAccSets={handleChangeAccSets}
                  onChangeAccReps={handleChangeAccReps}
                  onAssignAccessory={handleAssignAccessory}
                />
              ))}
            </div>
          </section>
        )}

        {/* Unassigned accessories */}
        {unassignedAccessories.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Unlink className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Unassigned Accessories</h3>
              <Badge variant="outline" className="text-xs">{unassignedAccessories.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Use the &quot;Paired to&quot; dropdown to link each accessory to a main exercise.
            </p>
            <div className="space-y-2">
              {unassignedAccessories.map((acc) => (
                <AccessoryRow
                  key={`ua-${acc.order}`}
                  acc={acc}
                  mainExercises={localExercises}
                  onChangeSets={handleChangeAccSets}
                  onChangeReps={handleChangeAccReps}
                  onAssign={handleAssignAccessory}
                />
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="flex-1 sm:flex-none sm:px-10" onClick={handleStartWorkout}>
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
            <Button size="lg" variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowSaveDialog(true)}>
              <BookmarkPlus className="h-5 w-5 mr-2" />
              {saved ? "Update Saved Workout" : "Save Workout"}
            </Button>
            <Button size="lg" variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowScheduleDialog(true)}>
              <CalendarDays className="h-5 w-5 mr-2" />
              {scheduled ? "Scheduled ✓" : "Schedule Workout"}
            </Button>
          </div>
          {saved && (
            <p className="text-sm text-muted-foreground mt-3">
              Saved —{" "}
              <button className="text-primary underline underline-offset-2" onClick={() => router.push("/saved-workouts")}>
                View in Saved Workouts
              </button>
            </p>
          )}
          {scheduled && (
            <p className="text-sm text-muted-foreground mt-3">
              Scheduled —{" "}
              <button className="text-primary underline underline-offset-2" onClick={() => router.push("/calendar")}>
                View Calendar
              </button>
            </p>
          )}
        </div>
      </main>

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{saved ? "Update Saved Workout" : "Save Workout"}</DialogTitle>
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
            {saved && (
              <p className="text-xs text-muted-foreground">
                This will overwrite the previously saved version including all pairings.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {saved ? "Update" : "Save"}
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
                {scheduleDates.length} date{scheduleDates.length !== 1 ? "s" : ""} selected:{" "}
                {scheduleDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }))
                  .join(", ")}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
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
