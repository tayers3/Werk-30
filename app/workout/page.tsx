"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { WorkoutExercise, calculateTotalDuration } from "@/lib/workout-store";
import { WorkoutList } from "@/components/workout-list";
import { WorkoutTimer } from "@/components/workout-timer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Timer } from "lucide-react";

function WorkoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [accessories, setAccessories] = useState<WorkoutExercise[]>([]);
  const [showTimer, setShowTimer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    const workoutData = searchParams.get("workout");
    if (workoutData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(workoutData));
        // Handle both old format (array) and new format (object with exercises/accessories)
        if (Array.isArray(parsed)) {
          setWorkoutExercises(parsed);
          setAccessories([]);
        } else {
          setWorkoutExercises(parsed.exercises || []);
          setAccessories(parsed.accessories || []);
        }
        setShowWelcomeMessage(true);
      } catch (error) {
        console.error("Failed to parse workout data:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  const totalDuration = calculateTotalDuration(workoutExercises, accessories);

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
        accessories={accessories}
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
                  {workoutExercises.length} exercises{accessories.length > 0 ? ` + ${accessories.length} accessories` : ""} • Ready to start
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

      {showWelcomeMessage && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center text-primary-foreground shadow-sm">
            Congratulations you made the first step!! It's time to put the work in!!
          </div>
        </div>
      )}

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
            totalDuration={totalDuration}
            maxDuration={30 * 60}
          />
        </div>
      </main>
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workout...</p>
        </div>
      </div>
    }>
      <WorkoutPageContent />
    </Suspense>
  );
}