"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { exercises, Exercise, MuscleGroup, Intensity, getAccessories } from "@/lib/exercises";
import { WorkoutExercise, calculateTotalDuration, useWorkoutStore, WorkoutPlan, generateWorkoutId, StrengthMaxes } from "@/lib/workout-store";
import type { IntakeGoal, IntakeFocus } from "@/lib/workout-store";
import { ExerciseCard } from "./exercise-card";
import { WorkoutList } from "./workout-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Dumbbell,
  Zap,
  Heart,
  Target,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Calendar as CalendarIcon,
  Home,
  Building2,
  Weight,
} from "lucide-react";

const WORKOUT_DURATION = 30 * 60; // 30 minutes in seconds

type WorkoutLocation = "gym" | "home";
type WorkoutGoal = "general" | "hypertrophy" | "strength" | "hiit";

// Percentage prescriptions by goal
const GOAL_PRESCRIPTIONS: Record<WorkoutGoal, { pct?: number; sets: string; reps: string; label: string; color: string }> = {
  general:     { sets: "3",   reps: "10-12", label: "General Fitness",  color: "bg-secondary" },
  hypertrophy: { pct: 0.70,  sets: "3-4",  reps: "8-12",  label: "Hypertrophy",     color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  strength:    { pct: 0.80,  sets: "4-5",  reps: "3-6",   label: "Strength",         color: "bg-primary/20 text-primary border-primary/30" },
  hiit:        { pct: 0.50,  sets: "3",    reps: "AMRAP",  label: "HIIT / Circuit",  color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

// Map exercise IDs to strength max keys
const LIFT_MAX_MAP: Record<string, keyof StrengthMaxes> = {
  bench: "bench", incline: "bench", decline: "bench",
  squat: "squat", hack: "squat", legpress: "squat",
  deadlift: "deadlift", rdl: "deadlift",
  ohp: "ohp",
};

function roundToNearest5(weight: number): number {
  return Math.round(weight / 5) * 5;
}

// Maps intake goal → preferred workout goal mode
const GOAL_TO_WORKOUT_GOAL: Record<IntakeGoal, WorkoutGoal> = {
  "lose-weight":  "hiit",
  "lose-fat":     "hiit",
  "recomp":       "general",
  "gain-muscle":  "hypertrophy",
  "gain-weight":  "strength",
  "other":        "general",
};

// Which MuscleGroups to surface first based on focus
const FOCUS_TO_MUSCLE: Record<IntakeFocus, MuscleGroup[]> = {
  "upper-body": ["upper-body"],
  "lower-body": ["lower-body"],
  "core":       ["core"],
  "cardio":     ["cardio"],
  "full-body":  ["full-body", "upper-body", "lower-body", "core"],
};

// Goal copy shown in the "Suggested" banner
const INTAKE_GOAL_LABELS: Record<IntakeGoal, string> = {
  "lose-weight": "Lose Weight",
  "lose-fat":    "Lose Body Fat",
  "recomp":      "Body Recomp",
  "gain-muscle": "Gain Muscle",
  "gain-weight": "Gain Weight",
  "other":       "General Fitness",
};

const INTAKE_FOCUS_LABELS: Record<IntakeFocus, string> = {
  "upper-body": "Upper Body",
  "lower-body": "Lower Body",
  "core":       "Core",
  "cardio":     "Cardio",
  "full-body":  "Full Body",
};

function getSuggestedExercises(
  allExercises: Exercise[],
  goal: IntakeGoal,
  focus: IntakeFocus,
  location: WorkoutLocation
): Exercise[] {
  const targetMuscles = FOCUS_TO_MUSCLE[focus];

  // Priority score: higher = more relevant
  const score = (ex: Exercise): number => {
    if (!ex.locations?.includes(location)) return -1;
    if (ex.type === "accessory") return -1;

    let s = 0;
    if (targetMuscles.includes(ex.muscleGroup)) s += 10;

    // Goal-based intensity preference
    if (goal === "lose-weight" || goal === "lose-fat") {
      if (ex.intensity === "high") s += 3;
      if (ex.muscleGroup === "cardio") s += 4;
    } else if (goal === "gain-muscle" || goal === "recomp") {
      if (ex.intensity === "medium" || ex.intensity === "high") s += 3;
    } else if (goal === "gain-weight") {
      if (ex.intensity === "high") s += 4;
    }

    return s;
  };

  return allExercises
    .map((ex) => ({ ex, score: score(ex) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ ex }) => ex);
}

const muscleGroupFilters: { value: MuscleGroup | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <Dumbbell className="h-4 w-4" /> },
  { value: "full-body", label: "Full Body", icon: <Target className="h-4 w-4" /> },
  { value: "upper-body", label: "Upper", icon: <Dumbbell className="h-4 w-4" /> },
  { value: "lower-body", label: "Lower", icon: <Zap className="h-4 w-4" /> },
  { value: "core", label: "Core", icon: <Target className="h-4 w-4" /> },
  { value: "cardio", label: "Cardio", icon: <Heart className="h-4 w-4" /> },
  { value: "stretching", label: "Stretch", icon: <Target className="h-4 w-4" /> },
];

const intensityFilters: { value: Intensity | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function WorkoutBuilder() {
  const router = useRouter();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [accessories, setAccessories] = useState<WorkoutExercise[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "all">("all");
  const [intensityFilter, setIntensityFilter] = useState<Intensity | "all">("all");
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation>("gym");
  const [isComplete, setIsComplete] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workoutLabel, setWorkoutLabel] = useState("");

  const { strengthMaxes, updateStrengthMax, workoutIntake } = useWorkoutStore();

  // Auto-populate workoutGoal from intake on first render
  const derivedGoal: WorkoutGoal = workoutIntake
    ? GOAL_TO_WORKOUT_GOAL[workoutIntake.goal]
    : "general";

  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal>(derivedGoal);

  // Re-sync workoutGoal whenever the user updates their intake preferences
  useEffect(() => {
    if (workoutIntake) {
      setWorkoutGoal(GOAL_TO_WORKOUT_GOAL[workoutIntake.goal]);
    }
  }, [workoutIntake]);

  const totalDuration = useMemo(
    () => calculateTotalDuration(workoutExercises, accessories),
    [workoutExercises, accessories]
  );

  const filteredExercises = useMemo(() => {
    return exercises
      .filter((ex) => ex.type !== "accessory")
      .filter((ex) => {
        const matchesMuscle = muscleFilter === "all" || ex.muscleGroup === muscleFilter;
        const matchesIntensity = intensityFilter === "all" || ex.intensity === intensityFilter;
        const matchesLocation = !ex.locations || ex.locations.includes(workoutLocation);
        return matchesMuscle && matchesIntensity && matchesLocation;
      });
  }, [muscleFilter, intensityFilter, workoutLocation]);

  const suggestedExercises = useMemo(() => {
    if (!workoutIntake) return [];
    return getSuggestedExercises(exercises, workoutIntake.goal, workoutIntake.focus, workoutLocation);
  }, [workoutIntake, workoutLocation]);

  const selectedIds = useMemo(
    () => new Set(workoutExercises.map((ex) => ex.id)),
    [workoutExercises]
  );

  const handleAddExercise = (exercise: Exercise) => {
    // Check if adding this exercise would exceed 30 minutes
    const potentialDuration = totalDuration + exercise.duration + 30; // 30s default rest
    if (potentialDuration > WORKOUT_DURATION + 60) {
      // Allow slight overage
      return;
    }

    const newExercise: WorkoutExercise = {
      ...exercise,
      type: exercise.type ?? "main",
      order: workoutExercises.length,
      restAfter: 30, // default 30 seconds rest
    };
    setWorkoutExercises([...workoutExercises, newExercise]);
  };

  const handleRemoveExercise = (order: number) => {
    const updated = workoutExercises
      .filter((ex) => ex.order !== order)
      .map((ex, i) => ({ ...ex, order: i }));
    setWorkoutExercises(updated);
  };

  const handleReorder = (reordered: WorkoutExercise[]) => {
    setWorkoutExercises(reordered);
  };

  const handleRestChange = (order: number, restTime: number) => {
    setWorkoutExercises(
      workoutExercises.map((ex) =>
        ex.order === order ? { ...ex, restAfter: restTime } : ex
      )
    );
  };

  // Sets & reps are independently editable; duration is never modified here
  const handleUpdateSets = (order: number, sets: number) => {
    setWorkoutExercises(
      workoutExercises.map((ex) =>
        ex.order === order ? { ...ex, sets: Math.max(1, sets) } : ex
      )
    );
  };

  const handleUpdateReps = (order: number, reps: string) => {
    setWorkoutExercises(
      workoutExercises.map((ex) =>
        ex.order === order ? { ...ex, reps } : ex
      )
    );
  };

  const handleUpdateDuration = (order: number, duration: number) => {
    setWorkoutExercises(
      workoutExercises.map((ex) =>
        ex.order === order ? { ...ex, duration: Math.max(1, duration) } : ex
      )
    );
  };

  const handleAddAccessory = (exercise: Exercise) => {
    if (accessories.length >= 2) return; // Max 2 accessories

    const newAccessory: WorkoutExercise = {
      ...exercise,
      type: exercise.type ?? "accessory",
      order: accessories.length,
      restAfter: 30, // default 30 seconds rest
    };
    setAccessories([...accessories, newAccessory]);
  };

  const handleRemoveAccessory = (order: number) => {
    const updated = accessories
      .filter((acc) => acc.order !== order)
      .map((acc, i) => ({ ...acc, order: i }));
    setAccessories(updated);
  };

  const handleReset = () => {
    setWorkoutExercises([]);
    setAccessories([]);
    setIsComplete(false);
  };

  const generateRandomWorkout = () => {
    const locationFiltered = exercises.filter(
      (ex) => ex.type !== "accessory" && (!ex.locations || ex.locations.includes(workoutLocation))
    );
    const shuffled = [...locationFiltered].sort(() => Math.random() - 0.5);
    const selected: WorkoutExercise[] = [];
    let duration = 0;

    for (const exercise of shuffled) {
      const exerciseTime = exercise.duration + 30; // exercise + rest
      if (duration + exerciseTime <= WORKOUT_DURATION) {
        selected.push({
          ...exercise,
          type: exercise.type ?? "main",
          order: selected.length,
          restAfter: 30,
        });
        duration += exerciseTime;
      }
      if (duration >= WORKOUT_DURATION - 60) break;
    }

    setWorkoutExercises(selected);
  };

  const canStartWorkout = workoutExercises.length >= 3 && totalDuration >= 10 * 60;

  const handleCraftWorkout = () => {
    useWorkoutStore.getState().setPendingWorkout({
      exercises: workoutExercises,
      accessories: accessories,
    });
    router.push("/workout-preview");
  };

  const handleScheduleWorkout = () => {
    if (!selectedScheduleDate) return;
    const workoutPlan: WorkoutPlan = {
      id: generateWorkoutId(),
      name: `Custom Workout ${selectedScheduleDate.toLocaleDateString()}`,
      exercises: workoutExercises,
      accessories: accessories,
      totalDuration,
      createdAt: new Date(),
    };
    const dateStr = selectedScheduleDate.toISOString().split('T')[0];
    useWorkoutStore.getState().addScheduledWorkout(dateStr, workoutPlan);
    setShowScheduleDialog(false);
    alert(`Workout scheduled for ${selectedScheduleDate.toLocaleDateString()}! Check the calendar.`);
  };

  const handleSaveWorkout = () => {
    const workoutPlan: WorkoutPlan = {
      id: generateWorkoutId(),
      name: workoutLabel || `Custom Workout ${new Date().toLocaleDateString()}`,
      exercises: workoutExercises,
      accessories: accessories,
      totalDuration,
      createdAt: new Date(),
    };
    useWorkoutStore.getState().saveWorkout(workoutPlan, workoutLabel);
    setShowSaveDialog(false);
    setWorkoutLabel("");
    alert("Workout saved! You can find it in your previous workouts.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Timer className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">WERK 30</h1>
                <p className="text-xs text-muted-foreground">30-Minute Workout Builder</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/weekly-split')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Weekly Split
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/saved-splits')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Saved Splits
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/saved-workouts')}
              >
                <Target className="h-4 w-4 mr-2" />
                Saved Workouts
              </Button>
              {workoutIntake && (
                <button
                  onClick={() => router.push('/workout-intake')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm font-medium transition-all"
                  title="Change training preferences"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-secondary-foreground">{INTAKE_GOAL_LABELS[workoutIntake.goal]}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{INTAKE_FOCUS_LABELS[workoutIntake.focus]}</span>
                </button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={workoutExercises.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleCraftWorkout}
                disabled={!canStartWorkout}
              >
                <Play className="h-4 w-4 mr-2" />
                Craft Workout
              </Button>
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canStartWorkout}
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Schedule Workout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Your Workout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Calendar
                      mode="single"
                      selected={selectedScheduleDate}
                      onSelect={setSelectedScheduleDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleScheduleWorkout} disabled={!selectedScheduleDate}>
                        Schedule
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canStartWorkout}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Save Workout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Your Workout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Workout Label (optional)
                      </label>
                      <input
                        type="text"
                        value={workoutLabel}
                        onChange={(e) => setWorkoutLabel(e.target.value)}
                        placeholder="e.g., Upper Body Focus, Leg Day, etc."
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveWorkout}>
                        Save Workout
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* App description */}
        <div className="mb-6 rounded-xl border border-border bg-card/60 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Build and complete a structured 30-minute workout</span> based on your preferences.
            Choose your goal, pick exercises, and hit &ldquo;Craft Workout&rdquo; when you&rsquo;re ready.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise library */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Preferences */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Training Preferences</h2>

              {/* Location toggle */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</label>
                <div className="flex gap-2">
                  {([
                    { value: "gym" as WorkoutLocation, label: "Gym", icon: <Building2 className="h-4 w-4" /> },
                    { value: "home" as WorkoutLocation, label: "Home", icon: <Home className="h-4 w-4" /> },
                  ] as const).map((loc) => (
                    <button
                      key={loc.value}
                      onClick={() => { setWorkoutLocation(loc.value); setWorkoutExercises([]); setAccessories([]); }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                        workoutLocation === loc.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      )}
                    >
                      {loc.icon}
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Goal</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(GOAL_PRESCRIPTIONS) as [WorkoutGoal, typeof GOAL_PRESCRIPTIONS[WorkoutGoal]][]).map(([goal, presc]) => (
                    <button
                      key={goal}
                      onClick={() => setWorkoutGoal(goal)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                        workoutGoal === goal
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      )}
                    >
                      {presc.label}
                    </button>
                  ))}
                </div>
                {workoutGoal !== "general" && (
                  <p className="text-xs text-muted-foreground">
                    Prescription: <span className="text-foreground font-medium">{GOAL_PRESCRIPTIONS[workoutGoal].sets} sets × {GOAL_PRESCRIPTIONS[workoutGoal].reps} reps</span>
                    {GOAL_PRESCRIPTIONS[workoutGoal].pct && (
                      <> · <span className="text-foreground font-medium">{Math.round(GOAL_PRESCRIPTIONS[workoutGoal].pct! * 100)}% of 1RM</span></>
                    )}
                  </p>
                )}
              </div>

              {/* Strength maxes (shown for strength + hiit goals) */}
              {(workoutGoal === "strength" || workoutGoal === "hypertrophy" || workoutGoal === "hiit") && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My 1-Rep Maxes (lbs) — optional</label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([ 
                      { key: "bench" as const, label: "Bench Press" },
                      { key: "squat" as const, label: "Squat" },
                      { key: "deadlift" as const, label: "Deadlift" },
                      { key: "ohp" as const, label: "OHP" },
                    ]).map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={strengthMaxes[key] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            updateStrengthMax(key, val);
                          }}
                          placeholder="0"
                          className="w-full px-2 py-1.5 border border-input rounded-md bg-background text-sm text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={generateRandomWorkout}
                className="bg-primary/5 border-primary/20 hover:bg-primary/10"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Random Workout
              </Button>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Muscle group filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Muscle Group
                </label>
                <div className="flex flex-wrap gap-2">
                  {muscleGroupFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setMuscleFilter(filter.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        muscleFilter === filter.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {filter.icon}
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Intensity
                </label>
                <div className="flex flex-wrap gap-2">
                  {intensityFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setIntensityFilter(filter.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        intensityFilter === filter.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested for you */}
            {workoutIntake && suggestedExercises.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Suggested for You
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Based on: <span className="text-foreground">{INTAKE_GOAL_LABELS[workoutIntake.goal]}</span>
                      {" · "}
                      <span className="text-foreground">{INTAKE_FOCUS_LABELS[workoutIntake.focus]}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedExercises.map((exercise) => {
                    const liftKey = LIFT_MAX_MAP[exercise.id];
                    const max = liftKey ? strengthMaxes[liftKey] : undefined;
                    const presc = GOAL_PRESCRIPTIONS[workoutGoal];
                    const weight = (max && presc.pct) ? roundToNearest5(max * presc.pct) : undefined;
                    const prescription = workoutGoal !== "general"
                      ? { sets: presc.sets, reps: presc.reps, weight }
                      : undefined;
                    return (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onAdd={handleAddExercise}
                        isSelected={selectedIds.has(exercise.id)}
                        disabled={totalDuration + exercise.duration + 30 > WORKOUT_DURATION + 60}
                        prescription={prescription}
                      />
                    );
                  })}
                </div>
                <div className="border-t border-border" />
              </div>
            )}

            {/* Exercise grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {workoutIntake ? "All Exercises" : "Available Exercises"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {filteredExercises.length} exercises
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredExercises.map((exercise) => {
                  const liftKey = LIFT_MAX_MAP[exercise.id];
                  const max = liftKey ? strengthMaxes[liftKey] : undefined;
                  const presc = GOAL_PRESCRIPTIONS[workoutGoal];
                  const weight = (max && presc.pct) ? roundToNearest5(max * presc.pct) : undefined;
                  const prescription = workoutGoal !== "general"
                    ? { sets: presc.sets, reps: presc.reps, weight }
                    : undefined;
                  return (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onAdd={handleAddExercise}
                      isSelected={selectedIds.has(exercise.id)}
                      disabled={totalDuration + exercise.duration + 30 > WORKOUT_DURATION + 60}
                      prescription={prescription}
                    />
                  );
                })}
              </div>
            </div>

            {/* Accessories section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Add Accessories
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (max 2, ~3 min each)
                  </span>
                </h2>
                <span className="text-sm text-muted-foreground">
                  {accessories.length}/2
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getAccessories().map((accessory) => {
                  const selected = accessories.some((acc) => acc.id === accessory.id);
                  return (
                    <ExerciseCard
                      key={accessory.id}
                      exercise={accessory}
                      onAdd={handleAddAccessory}
                      isSelected={selected}
                      disabled={accessories.length >= 2 && !selected}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Workout plan sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4 h-[calc(100vh-8rem)] flex flex-col">
              <WorkoutList
                exercises={workoutExercises}
                onRemove={handleRemoveExercise}
                onReorder={handleReorder}
                onRestChange={handleRestChange}
                onSetsChange={handleUpdateSets}
                onRepsChange={handleUpdateReps}
                onDurationChange={handleUpdateDuration}
                totalDuration={totalDuration}
                maxDuration={WORKOUT_DURATION}
              />
              {workoutExercises.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCraftWorkout}
                    disabled={!canStartWorkout}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {canStartWorkout
                      ? "Start Workout"
                      : workoutExercises.length < 3
                      ? `Add ${3 - workoutExercises.length} more exercise${
                          3 - workoutExercises.length > 1 ? "s" : ""
                        }`
                      : "Add more time"}
                  </Button>
                  {!canStartWorkout && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Minimum 3 exercises and 10 minutes required
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion state */}
        {isComplete && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">💪</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Workout Complete!
              </h2>
              <p className="text-muted-foreground mb-6">
                Amazing work! You&apos;ve completed your 30-minute workout.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleReset}>
                  New Workout
                </Button>
                <Button onClick={() => setIsComplete(false)}>Done</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
