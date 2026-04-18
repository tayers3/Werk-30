"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkoutExercise } from "@/lib/workout-store";
import { WorkoutList } from "@/components/workout-list";
import { WorkoutTimer } from "@/components/workout-timer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Timer } from "lucide-react";

export default function WorkoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [showTimer, setShowTimer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const workoutData = searchParams.get("workout");
    if (workoutData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(workoutData));
        setWorkoutExercises(parsed);
      } catch (error) {
        console.error("Failed to parse workout data:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  const handleStartWorkout = () => {
    setShowTimer(true);
  };

  const handleBackToBuilder = () => {
    router.push("/");
  };

  if (showTimer) {
    return (
      <WorkoutTimer
        exercises={workoutExercises}
        onComplete={() => setIsComplete(true)}
        onClose={() => setShowTimer(false)}
      />
    );
  }

  if (workoutExercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToBuilder}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Builder
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Timer className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Your Workout</h1>
                <p className="text-xs text-muted-foreground">
                  {workoutExercises.length} exercises • Ready to start
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleStartWorkout}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              🎯 Your Crafted Workout
            </h2>
            <p className="text-muted-foreground">
              Review your exercises and get ready to crush it!
            </p>
          </div>

          <WorkoutList
            exercises={workoutExercises}
            onRemove={() => {}} // Read-only on this page
            onReorder={() => {}} // Read-only on this page
            onRestChange={() => {}} // Read-only on this page
            readOnly={true}
          />
        </div>
      </main>
    </div>
  );
}