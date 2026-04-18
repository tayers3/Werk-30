"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { exercises, Exercise, MuscleGroup, Intensity, getAccessories } from "@/lib/exercises";
import { WorkoutExercise, calculateTotalDuration } from "@/lib/workout-store";
import { ExerciseCard } from "./exercise-card";
import { WorkoutList } from "./workout-list";
import { WorkoutTimer } from "./workout-timer";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const WORKOUT_DURATION = 30 * 60; // 30 minutes in seconds

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
  const [showTimer, setShowTimer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalDuration = useMemo(
    () => calculateTotalDuration(workoutExercises, accessories),
    [workoutExercises, accessories]
  );

  const filteredExercises = useMemo(() => {
    return exercises
      .filter((ex) => ex.type !== "accessory") // Exclude accessories from main list
      .filter((ex) => {
        const matchesMuscle = muscleFilter === "all" || ex.muscleGroup === muscleFilter;
        const matchesIntensity = intensityFilter === "all" || ex.intensity === intensityFilter;
        return matchesMuscle && matchesIntensity;
      });
  }, [muscleFilter, intensityFilter]);

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

  const handleAddAccessory = (exercise: Exercise) => {
    if (accessories.length >= 2) return; // Max 2 accessories

    const newAccessory: WorkoutExercise = {
      ...exercise,
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
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    const selected: WorkoutExercise[] = [];
    let duration = 0;

    for (const exercise of shuffled) {
      const exerciseTime = exercise.duration + 30; // exercise + rest
      if (duration + exerciseTime <= WORKOUT_DURATION) {
        selected.push({
          ...exercise,
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
    const workoutData = {
      exercises: workoutExercises,
      accessories: accessories,
    };
    const encoded = encodeURIComponent(JSON.stringify(workoutData));
    router.push(`/workout?workout=${encoded}`);
  };

  if (showTimer) {
    return (
      <WorkoutTimer
        exercises={workoutExercises}
        accessories={accessories}
        onComplete={() => setIsComplete(true)}
        onClose={() => setShowTimer(false)}
      />
    );
  }

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
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise library */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Exercise grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Available Exercises
                </h2>
                <span className="text-sm text-muted-foreground">
                  {filteredExercises.length} exercises
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onAdd={handleAddExercise}
                    isSelected={selectedIds.has(exercise.id)}
                    disabled={
                      totalDuration + exercise.duration + 30 > WORKOUT_DURATION + 60
                    }
                  />
                ))}
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
                totalDuration={totalDuration}
                maxDuration={WORKOUT_DURATION}
              />
              {workoutExercises.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowTimer(true)}
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
